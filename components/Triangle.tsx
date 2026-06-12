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
  onSelectDot,
}: {
  movies: Movie[];
  selectedMovie: any;
  onAdd: (movie: any) => void;
  onSelectDot: (movie: Movie) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedDot, setSelectedDot] = useState<Movie | null>(null);

  const dragPos = useRef<Record<string, { x: number; y: number }>>({});
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const lastSent = useRef<Record<string, number>>({});

  function getMousePos(e: any) {
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

  function deleteDot(id: string) {
    fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function startDrag(id: string) {
    setDraggingId(id);
  }

  function stopDrag() {
    setDraggingId(null);
  }

  function handleMouseMove(e: any) {
    const rect = e.currentTarget.getBoundingClientRect();

    const pos = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };

    pointerRef.current = pos;

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        if (draggingId && pointerRef.current) {
          const { x, y } = pointerRef.current;

          dragPos.current[draggingId] = { x, y };
          sendUpdate(draggingId, x, y);
        }
      });
    }
  }

  function handleTriangleClick(e: any) {
    if (!selectedMovie) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const bary = cartesianToBarycentric(x, y);

    onAdd({
      title: selectedMovie.title,
      tmdb_id: selectedMovie.id,
      poster: selectedMovie.poster_path,
      year: selectedMovie.release_date,
      ...bary,
    });
  }

  function pct(v: number) {
    return `${(v * 100).toFixed(0)}%`;
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="shrink-0 px-2 pt-2 space-y-2">
        <h1 className="text-2xl font-bold">Selection</h1>

        {selectedDot && (
          <div className="border rounded bg-white shadow p-3 text-sm w-fit">
            <div className="font-bold text-base mb-1">
              {selectedDot.title}
            </div>
            <div>Shrek: {pct(selectedDot.shrek)}</div>
            <div>Inception: {pct(selectedDot.inception)}</div>
            <div>Morbius: {pct(selectedDot.morbius)}</div>
          </div>
        )}

        {selectedMovie && (
          <div className="text-sm mb-1">
            Selected: <b>{selectedMovie.title}</b>
          </div>
        )}
      </div>

      {/* TRIANGLE */}
      <div className="flex-1 min-h-0 flex items-center justify-center">

        <svg
          viewBox="0 0 100 100"
          className="w-full h-full border"
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onClick={handleTriangleClick}
        >
          <polygon
            points="50,5 5,95 95,95"
            fill="none"
            stroke="black"
          />

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
                  r={0.9}
                  fill="black"
                  stroke="white"
                  strokeWidth="0.3"
                  style={{ cursor: "grab" }}
                  onMouseDown={() => startDrag(m.id)}
                  onClick={(e) => {
                    e.stopPropagation();

                    // ✅ SHIFT + CLICK DELETE
                    if (e.shiftKey) {
                      deleteDot(m.id);
                      return;
                    }

                    setSelectedDot(m);
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