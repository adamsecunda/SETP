import { useEffect, useState } from "react";

interface Price {
  ticker: string;
  price: number;
}

export default function MarketTicker() {
  const [prices, setPrices] = useState<Price[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://localhost:8000/api/market/prices/")
        .then(res => res.json())
        .then(data => setPrices(data));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Live Market</h2>
      {prices.map(p => (
        <div key={p.ticker}>
          {p.ticker}: ${p.price.toFixed(2)}
        </div>
      ))}
    </div>
  );
}