export const PALETTE = {
  EXCITED: "#B4E7B4",
  HAPPY: "#F9E59B",
  NERVOUS: "#FFCC99",
  SAD: "#B8C9F2",
  ANGRY: "#F2B1B1",
};

export const MOODS = [
  { label: "excited", emoji: "🤩", color: PALETTE.EXCITED, weight: 100 },
  { label: "happy", emoji: "😄", color: PALETTE.HAPPY, weight: 75 },
  { label: "nervous", emoji: "😬", color: PALETTE.NERVOUS, weight: 50 },
  { label: "sad", emoji: "😢", color: PALETTE.SAD, weight: 25 },
  { label: "angry", emoji: "😡", color: PALETTE.ANGRY, weight: 0 },
];

export const getStatus = (val: number) => {
  if (val >= 80) return { label: "ECSTATIC", color: PALETTE.EXCITED };
  if (val >= 60) return { label: "OPTIMISTIC", color: PALETTE.HAPPY };
  if (val >= 40) return { label: "TENSE", color: PALETTE.NERVOUS };
  if (val >= 20) return { label: "DEFLATED", color: PALETTE.SAD };
  return { label: "OUTRAGED", color: PALETTE.ANGRY };
};
