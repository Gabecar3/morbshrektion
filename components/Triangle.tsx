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

  async function handleDelete(id: string) {
    await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="shrink-0 px-3 pt-3 space-y-3">

        <div className="border-t border-dashed border-gray-400 pt-2" />

        <div className="text-xs bg-gray-50 border rounded p-2 w-fit">
          <div className="font-bold text-sm mb-1">
            Controls
          </div>
          <div>Click triangle → place movie</div>
          <div>Click dot → select</div>
          <div>Shift + Click → delete</div>
          <div>Drag → move instantly</div>
        </div>

        <div className="font-bold text-sm">
          Selected Movie
        </div>

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
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={handleTriangleClick}
        >
          {/* triangle */}
          <polygon
            points="50,5 5,95 95,95"
            fill="none"
            stroke="black"
          />

          {/* labels */}
          <text x="50" y="4" textAnchor="middle" fontSize="4">
            Inception
          </text>
          <text x="5" y="98" textAnchor="start" fontSize="4">
            Morbius
          </text>
          <text x="95" y="98" textAnchor="end" fontSize="4">
            Shrek
          </text>

          {/* dots */}
          {movies.map((m) => {
            const pos =
              dragPos.current[m.id] ??
              barycentricToCartesian(
                m.shrek,
                m.inception,
                m.morbius
              );

            const isSelected = selectedDotId === m.id;
            const isHovered = hoveredId === m.id;
            const isDragging = draggingId === m.id;

            return (
              <g key={m.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isDragging ? 1.2 : isHovered ? 1.0 : 0.85}
                  fill={isDragging ? "#ff4d4d" : "black"}
                  stroke={isSelected ? "#3b82f6" : "white"}
                  strokeWidth={0.4}
                  style={{
                    cursor: isDragging ? "grabbing" : "grab",
                    transition: "r 0.08s ease",
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDraggingId(m.id);
                  }}
                  onPointerEnter={() => setHoveredId(m.id)}
                  onPointerLeave={() => setHoveredId(null)}
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
                  opacity={isHovered || isSelected ? 1 : 0.6}
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