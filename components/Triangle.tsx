"use client";

import { useRef, useState, useMemo } from "react";
import {
  barycentricToCartesian,
  cartesianToBarycentric,
} from "@/lib/math";

type Movie = {
  id: string;
  title: string;
  shrek: number;
  inception: number;
  morbius: number;
};

export default function Triangle({
  movies,
  selectedMovie,
  onAdd,
}: {
  movies: Movie[];
  selectedMovie: any;
  onAdd: (movie: any) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedDotId, setSelectedDotId] = useState<string | null>(null);

  const dragPos = useRef<Record<string, { x: number; y: number }>>({});
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const raf = useRef<number | null>(null);
  const lastSent = useRef<Record<string, number>>({});

  function getPos(e: any) {
    const rect = e.currentTarget.getBoundingClientRect();

    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }

  function sendUpdate(id: string, x: number, y: number) {
    const now = Date.now();

    if (lastSent.current[id] && now - lastSent.current[id] < 120) return;
    lastSent.current[id] = now;

    const bary = cartesianToBarycentric(x, y);

    fetch("/api/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...bary }),
    });
  }

  function handleMouseMove(e: any) {
    if (!draggingId) return;

    const rect = e.currentTarget.getBoundingClientRect();

    pointer.current = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };

    if (!raf.current) {
      raf.current = requestAnimationFrame(() => {
        raf.current = null;

        if (!draggingId || !pointer.current) return;

        const { x, y } = pointer.current;

        dragPos.current[draggingId] = { x, y };
        sendUpdate(draggingId, x, y);
      });
    }
  }

  function handleMouseUp() {
    setDraggingId(null);
  }

  async function handleDelete(id: string) {
    await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function getSelectedDot(): Movie | null {
    if (!selectedDotId) return null;
    return movies.find((m) => m.id === selectedDotId) || null;
  }

  const selectedDot = getSelectedDot();

  function pct(v: number) {
    return `${(v * 100).toFixed(0)}%`;
  }

  async function handleTriangleClick(e: any) {
    if (!selectedMovie) return;

    const { x, y } = getPos(e);

    const bary = cartesianToBarycentric(x, y);

    await onAdd({
      title: selectedMovie.title,
      tmdb_id: selectedMovie.id,
      poster: selectedMovie.poster_path,
      year: selectedMovie.release_date,
      ...bary,
    });
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="shrink-0 px-3 pt-3 space-y-3">

        <div className="border-t border-dashed border-gray-400 pt-2" />

        {/* CONTROLS */}
        <div className="text-xs bg-gray-50 border rounded p-2 w-fit">
          <div className="font-bold text-sm mb-1">
            Controls
          </div>
          <div>Click triangle → place movie</div>
          <div>Click dot → view info</div>
          <div>Shift + Click → delete dot</div>
          <div>Drag dot → reposition</div>
        </div>

        {/* SELECTED HEADER */}
        <div className="font-bold text-sm">
          Selected Movie
        </div>

        {/* SELECTED INFO */}
        {selectedDot && (
          <div className="border rounded bg-white shadow p-3 text-sm w-fit">
            <div className="font-semibold mb-1">
              {selectedDot.title}
            </div>
            <div>Shrek: {pct(selectedDot.shrek)}</div>
            <div>Inception: {pct(selectedDot.inception)}</div>
            <div>Morbius: {pct(selectedDot.morbius)}</div>
          </div>
        )}

        {selectedMovie && (
          <div className="text-sm">
            Placing: <b>{selectedMovie.title}</b>
          </div>
        )}
      </div>

      {/* TRIANGLE */}
      <div className="flex-1 min-h-0 flex items-center justify-center">

        <svg
          viewBox="0 0 100 100"
          className="w-full h-full border"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleTriangleClick}
        >
          <polygon
            points="50,5 5,95 95,95"
            fill="none"
            stroke="black"
          />

          <text x="50" y="4" textAnchor="middle" fontSize="4">
            Inception
          </text>
          <text x="5" y="98" textAnchor="start" fontSize="4">
            Morbius
          </text>
          <text x="95" y="98" textAnchor="end" fontSize="4">
            Shrek
          </text>

          {movies.map((m) => {
            const pos =
              dragPos.current[m.id] ??
              barycentricToCartesian(
                m.shrek,
                m.inception,
                m.morbius
              );

            return (
              <g key={m.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={0.85}
                  fill="black"
                  stroke="white"
                  strokeWidth="0.3"
                  style={{ cursor: "grab" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingId(m.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();

                    if (e.shiftKey) {
                      handleDelete(m.id);
                      return;
                    }

                    setSelectedDotId(m.id);
                  }}
                />

                <text
                  x={pos.x + 2}
                  y={pos.y - 2}
                  fontSize="3"
                  pointerEvents="none"
                >
                  {m.title.slice(0, 3).toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>

      </div>
    </div>
  );
}