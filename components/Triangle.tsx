"use client";

import { useRef, useState } from "react";
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
  const [selectedDotId, setSelectedDotId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const dragPos = useRef<Record<string, { x: number; y: number }>>({});
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const raf = useRef<number | null>(null);
  const lastSent = useRef<Record<string, number>>({});

  function pct(v: number) {
    return `${(v * 100).toFixed(0)}%`;
  }

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

  function handlePointerMove(e: any) {
    if (!draggingId) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    pointer.current = { x, y };
    dragPos.current[draggingId] = { x, y };

    if (!raf.current) {
      raf.current = requestAnimationFrame(() => {
        raf.current = null;

        if (!draggingId || !pointer.current) return;

        sendUpdate(draggingId, pointer.current.x, pointer.current.y);
      });
    }
  }

  function handlePointerUp() {
    setDraggingId(null);
  }

  async function handleDelete(id: string) {
    await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (selectedDotId === id) {
      setSelectedDotId(null);
    }
  }

  const selectedDot =
    movies.find((m) => m.id === selectedDotId) || null;

  function handleTriangleClick(e: any) {
    if (!selectedMovie) return;

    const { x, y } = getPos(e);

    const bary = cartesianToBarycentric(x, y);

    onAdd({
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
      <div className="shrink-0 px-4 pt-4 space-y-4">

        <div className="border-t border-dashed border-gray-400 pt-2" />

        {/* CONTROLS CARD */}
        <div className="bg-gray-50 border rounded-lg p-3 shadow-sm w-fit min-w-[220px]">

          <div className="text-base font-bold mb-2 tracking-wide">
            Controls
          </div>

          <div className="text-xs leading-relaxed space-y-1 text-gray-700">
            <div>Click triangle → place movie</div>
            <div>Click dot → select</div>
            <div>Shift + Click → delete</div>
            <div>Drag → move instantly</div>
          </div>
        </div>

        {/* SELECTED HEADER */}
        <div className="text-base font-bold tracking-wide">
          Selected Movie
        </div>

        {/* SELECTED CARD */}
        {selectedDot && (
          <div className="border rounded-lg bg-white shadow-md p-3 text-sm w-fit min-w-[220px]">

            <div className="font-semibold text-base mb-2">
              {selectedDot.title}
            </div>

            <div className="space-y-1 text-gray-700">
              <div>Shrek: {pct(selectedDot.shrek)}</div>
              <div>Inception: {pct(selectedDot.inception)}</div>
              <div>Morbius: {pct(selectedDot.morbius)}</div>
            </div>
          </div>
        )}

        {!selectedDot && (
          <div className="text-xs text-gray-500 italic">
            Click a dot to view details
          </div>
        )}

        {selectedMovie && (
          <div className="text-sm text-gray-700">
            Placing: <b>{selectedMovie.title}</b>
          </div>
        )}
      </div>

      {/* TRIANGLE */}
      <div className="flex-1 min-h-0 flex items-center justify-center">

        <svg
          viewBox="0 0 100 100"
          className="w-full h-full border"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
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

            const isSelected = selectedDotId === m.id;

            return (
              <g key={m.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={0.9}
                  fill="black"
                  stroke={isSelected ? "#3b82f6" : "white"}
                  strokeWidth={0.4}
                  style={{ cursor: "grab" }}
                  onPointerDown={(e) => {
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
                  opacity={0.7}
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