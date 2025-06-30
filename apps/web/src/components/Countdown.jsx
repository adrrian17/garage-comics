import { useEffect, useState } from "react";

export default function Countdown() {
  const dateDiff = () => {
    const todayDate = new Date();
    const futureDate = new Date("2024-08-30T11:59:59");

    const diff = futureDate - todayDate;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, mins, secs };
  };

  const [days, setDays] = useState({ "--value": 0 });
  const [hours, seHours] = useState({ "--value": 0 });
  const [minutes, setMinutes] = useState({ "--value": 0 });
  const [seconds, setSeconds] = useState({ "--value": 0 });

  // biome-ignore lint/correctness/useExhaustiveDependencies: We don't need to re-run the effect when the date changes
  useEffect(() => {
    const interval = setInterval(() => {
      var diff = dateDiff();

      setDays({ "--value": diff.days });
      seHours({ "--value": diff.hours });
      setMinutes({ "--value": diff.mins });
      setSeconds({ "--value": diff.secs });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-5 mb-12 lg:flex-row text-secondary-100 bg-secondary-500 w-full p-6">
      <div>El festival termina en:</div>
      <div className="flex justify-end gap-5">
        <div className="text-center">
          <span className="font-mono text-4xl countdown">
            <span className="mr-1" style={days}></span>
          </span>
          días
        </div>
        <div className="text-center">
          <span className="font-mono text-4xl countdown">
            <span className="mr-1" style={hours}></span>
          </span>
          horas
        </div>
        <div className="text-center">
          <span className="font-mono text-4xl countdown">
            <span className="mr-1" style={minutes}></span>
          </span>
          minutos
        </div>
        <div className="text-center">
          <span className="font-mono text-4xl countdown">
            <span className="mr-1" style={seconds}></span>
          </span>
          segundos
        </div>
      </div>
    </div>
  );
}
