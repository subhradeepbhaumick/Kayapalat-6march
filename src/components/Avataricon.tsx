import { CircleUserRound } from "lucide-react";

interface AvatarIconProps {
  size?: number;
}

export default function AvatarIcon({ size = 32 }: AvatarIconProps) {
  return (
    <div
      className="rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(to right, #166534, #047857)", // green-800 → emerald-800
      }}
    >
      <CircleUserRound
        style={{ width: size * 0.55, height: size * 0.55 }}
        className="text-white"
      />
    </div>
  );
}
