import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function OccupancyGauge({ percentage = 75 }) {
  const data = [
    { name: 'Occupied', value: percentage },
    { name: 'Empty', value: 100 - percentage },
  ];

  const COLORS = ['#000000', '#E5E5E5'];

  return (
    <div className="w-full h-[250px] border border-black p-4 flex flex-col items-center justify-center relative">
      <h3 className="absolute top-4 left-4 text-xs font-bold uppercase tracking-widest">Occupancy</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cy="70%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute bottom-8 flex flex-col items-center">
        <span className="text-4xl font-bold tracking-tighter">%{percentage}</span>
        <span className="text-xs text-gray-400 font-mono mt-1">CAPACITY</span>
      </div>
    </div>
  );
}
