import { useEffect, useState } from "react";

export default function Countdown() {
  const dateDiff = () => {
    const todayDate = new Date();
    const futureDate = new Date(import.meta.env.PUBLIC_COUNTDOWN_DATE);

    const diff = futureDate - todayDate;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, mins, secs };
  };

  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: We don't need to re-run the effect when the date changes
  useEffect(() => {
    const interval = setInterval(() => {
      var diff = dateDiff();

      setDays(diff.days);
      setHours(diff.hours);
      setMinutes(diff.mins);
      setSeconds(diff.secs);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto bg-amber-100/90 backdrop-blur-sm rounded-xl shadow-2xl p-8 md:p-12 mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-900 mb-2">
        El evento termina en
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-8">
        <div className="text-center bg-white p-4 rounded-xl border border-black/5 shadow-md">
          <div className="text-5xl md:text-7xl font-bold text-amber-800 tabular-nums">
            {String(days).padStart(2, "0")}
          </div>
          <div className="text-sm uppercase tracking-widest text-amber-900/80 mt-2">
            Días
          </div>
        </div>
        <div className="text-center bg-white p-4 rounded-xl border border-black/5 shadow-md">
          <div className="text-5xl md:text-7xl font-bold text-amber-800 tabular-nums">
            {String(hours).padStart(2, "0")}
          </div>
          <div className="text-sm uppercase tracking-widest text-amber-900/80 mt-2">
            Horas
          </div>
        </div>
        <div className="text-center bg-white p-4 rounded-xl border border-black/5 shadow-md">
          <div className="text-5xl md:text-7xl font-bold text-amber-800 tabular-nums">
            {String(minutes).padStart(2, "0")}
          </div>
          <div className="text-sm uppercase tracking-widest text-amber-900/80 mt-2">
            Minutos
          </div>
        </div>
        <div className="text-center bg-white p-4 rounded-xl border border-black/5 shadow-md">
          <div className="text-5xl md:text-7xl font-bold text-amber-800 tabular-nums">
            {String(seconds).padStart(2, "0")}
          </div>
          <div className="text-sm uppercase tracking-widest text-amber-900/80 mt-2">
            Segundos
          </div>
        </div>
      </div>
    </div>
  );
}
