import { Shape, Circle, Square } from "./inheritance";

export function totalArea(shapes: Shape[]): number {
  let total = 0;
  for (const s of shapes) {
    total += s.area();
  }
  return total;
}

export function describeAll(shapes: Shape[]): string[] {
  const descriptions: string[] = [];
  for (const s of shapes) {
    descriptions.push(s.describe());
  }
  return descriptions;
}

export function largestShape(shapes: Shape[]): Shape | null {
  if (shapes.length === 0) {
    return null;
  }

  let largest: Shape = shapes[0];
  let maxArea: number = largest.area();

  for (const s of shapes) {
    const a = s.area();
    if (a > maxArea) {
      maxArea = a;
      largest = s;
    }
  }

  return largest;
}

export function createShapeGallery(): Shape[] {
  const gallery: Shape[] = [];
  gallery.push(new Circle("red", 10));
  gallery.push(new Square("blue", 7));
  gallery.push(new Circle("green", 3));
  gallery.push(new Square("yellow", 12));
  return gallery;
}

export function filterByColor(shapes: Shape[], color: string): Shape[] {
  const result: Shape[] = [];
  for (const s of shapes) {
    if (s.color === color) {
      result.push(s);
    }
  }
  return result;
}
