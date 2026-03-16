import { CarFront } from "lucide-react";

export default function BrandLogo({ size = "md" }) {
  const sizes = {
    sm: {
      box: "h-10 w-10",
      icon: 18,
      text: "text-lg",
      sub: "text-[10px]",
    },
    md: {
      box: "h-12 w-12",
      icon: 22,
      text: "text-2xl",
      sub: "text-xs",
    },
    lg: {
      box: "h-14 w-14",
      icon: 26,
      text: "text-3xl",
      sub: "text-sm",
    },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${s.box} rounded-2xl bg-[#ff5f00] flex items-center justify-center shadow-lg`}>
        <CarFront size={s.icon} color="white" />
        <span className="absolute -bottom-1 -right-1 rounded-md bg-black px-1.5 py-0.5 text-[10px] font-black text-white border border-white/10">
          AL
        </span>
      </div>

      <div>
        <h1 className={`${s.text} font-extrabold tracking-wide text-white`}>
          AutoLuxe
        </h1>
        <p className={`${s.sub} text-gray-400`}>Premium Car Rental</p>
      </div>
    </div>
  );
}