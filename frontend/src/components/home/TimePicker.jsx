import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3 } from "lucide-react";

const TIME_OPTIONS = [
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30",
  "03:00", "03:30", "04:00", "04:30", "05:00", "05:30",
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
];

function getSectionLabel(time) {
  const hour = Number(time.split(":")[0]);
  if (hour < 8) return "Early Morning";
  if (hour < 13) return "Morning - afternoon";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

export default function TimePicker({
  title = "Select time",
  label = "Select time",
  value,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const groupedTimes = useMemo(() => {
    const groups = {};
    for (const time of TIME_OPTIONS) {
      const key = getSectionLabel(time);
      if (!groups[key]) groups[key] = [];
      groups[key].push(time);
    }
    return groups;
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-[#2a2a2a] px-4 py-3 text-base text-white"
      >
        <span>{value || label}</span>
        <Clock3 size={16} className="text-gray-300" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-[390px] overflow-hidden rounded-[28px] border border-gray-200 bg-white text-black shadow-2xl">
          <div className="border-b border-gray-200 px-6 py-5">
            <h4 className="text-2xl font-bold">{title}</h4>
            <p className="mt-3 text-sm text-gray-500">
              Opening Times: 00:00 - 24:00
            </p>
          </div>

          <div className="max-h-[430px] overflow-y-auto px-5 py-4">
            {Object.entries(groupedTimes).map(([section, times]) => (
              <div key={section} className="mb-6 last:mb-0">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  {section}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {times.map((time) => {
                    const active = value === time;

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => {
                          onChange(time);
                          setOpen(false);
                        }}
                        className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
                          active
                            ? "bg-black text-white"
                            : "bg-[#f3f3f3] text-gray-800 hover:bg-[#e9e9e9]"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}