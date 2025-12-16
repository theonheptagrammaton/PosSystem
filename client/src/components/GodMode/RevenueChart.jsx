import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { time: '09:00', amount: 1200 },
  { time: '10:00', amount: 2100 },
  { time: '11:00', amount: 1800 },
  { time: '12:00', amount: 4500 },
  { time: '13:00', amount: 3200 },
  { time: '14:00', amount: 2800 },
  { time: '15:00', amount: 3600 },
  { time: '16:00', amount: 5100 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black text-white p-2 border-none outline-none rounded-none text-xs font-mono">
        <p>{`${label} : $${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data }) {
  // Use dummy data if no data provided
  const chartData = data && data.length > 0 ? data : [
    { time: '09:00', amount: 0 },
    { time: '10:00', amount: 0 },
    { time: '11:00', amount: 0 },
    { time: '12:00', amount: 0 },
  ];

  return (
    <div className="w-full h-[300px] border border-white p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-white">SAATLİK CİRO</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="#333" 
          />
          <XAxis 
            dataKey="time" 
            stroke="#ffffff" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="#ffffff" 
            fontSize={10} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#000', border: '1px solid #fff' }}
            itemStyle={{ color: '#fff' }}
            cursor={{ stroke: '#fff', strokeWidth: 1 }} 
          />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="#ffffff" 
            strokeWidth={2}
            fill="url(#colorAmount)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
