import { 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, 
  XAxis, YAxis, Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, Cell,
  Legend
} from 'recharts';

const COLORS = ['#FFFFFF', '#888888', '#444444', '#222222', '#666666'];

export const DailyRevenueChart = ({ data }) => (
  <div className="w-full h-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
        <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#000', border: '1px solid #fff', borderRadius: '0' }}
          itemStyle={{ color: '#fff' }}
          cursor={{ stroke: '#fff', strokeWidth: 1 }}
        />
        <Area type="monotone" dataKey="amount" stroke="#fff" fill="url(#colorRevenue)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export const BranchPerformanceChart = ({ data }) => (
  <div className="w-full h-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
        <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#000', border: '1px solid #fff', borderRadius: '0' }}
          itemStyle={{ color: '#fff' }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="total" fill="#fff" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const TopProductsChart = ({ data }) => (
  <div className="w-full h-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart layout="vertical" data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
        <XAxis type="number" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} width={80} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#000', border: '1px solid #fff', borderRadius: '0' }}
          itemStyle={{ color: '#fff' }}
        />
        <Bar dataKey="quantity" fill="#fff" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const CategoryShareChart = ({ data }) => (
  <div className="w-full h-full">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#000', border: '1px solid #fff', borderRadius: '0' }}
          itemStyle={{ color: '#fff' }}
        />
        <Legend 
            verticalAlign="bottom" 
            align="center"
            iconType="circle"
            formatter={(value) => <span className="text-[10px] text-gray-400 font-mono">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
