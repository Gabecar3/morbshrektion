export function cartesianToBarycentric(x: number, y: number) {
  // Triangle vertices (same as SVG)
  const A = { x: 50, y: 5 };   // Inception (top)
  const B = { x: 5, y: 95 };   // Morbius (bottom left)
  const C = { x: 95, y: 95 };  // Shrek (bottom right)

  const denominator =
    (B.y - C.y) * (A.x - C.x) +
    (C.x - B.x) * (A.y - C.y);

  const a =
    ((B.y - C.y) * (x - C.x) +
      (C.x - B.x) * (y - C.y)) /
    denominator;

  const b =
    ((C.y - A.y) * (x - C.x) +
      (A.x - C.x) * (y - C.y)) /
    denominator;

  const c = 1 - a - b;

  return {
    shrek: c,
    inception: a,
    morbius: b,
  };
}

export function barycentricToCartesian(
  shrek: number,
  inception: number,
  morbius: number
) {
  return {
    x:
      shrek * 95 +
      inception * 50 +
      morbius * 5,

    y:
      shrek * 95 +
      inception * 5 +
      morbius * 95,
  };
}