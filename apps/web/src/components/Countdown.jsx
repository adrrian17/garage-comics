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
    <div className="flex flex-col items-center justify-center gap-5 mb-12 lg:flex-row text-secondary-100 bg-secondary-500 w-full p-6">
      <div>El evento termina en:</div>
      <div className="flex justify-end gap-5">
        <div className="text-center">
          <span className="text-4xl">
            <span className="mr-1">{days}</span>
          </span>
          días
        </div>
        <div className="text-center">
          <span className="text-4xl">
            <span className="mr-1">{hours}</span>
          </span>
          horas
        </div>
        <div className="text-center">
          <span className="text-4xl">
            <span className="mr-1">{minutes}</span>
          </span>
          minutos
        </div>
        <div className="text-center">
          <span className="text-4xl">
            <span className="mr-1">{seconds}</span>
          </span>
          segundos
        </div>
      </div>
    </div>
  );
}
