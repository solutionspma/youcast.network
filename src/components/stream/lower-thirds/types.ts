export type LowerThirdPosition =
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type LowerThirdAnimation =
  | "slide"
  | "fade";

export type LowerThirdPayload = {
  id: string;
  name: string;
  title?: string;
  position: LowerThirdPosition;
  animation: LowerThirdAnimation;
  duration?: number; // ms
};
