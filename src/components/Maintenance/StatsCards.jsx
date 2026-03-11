import { Settings, ClipboardList, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const StatsCards = ({ stats, onCardClick }) => {
  const cards = [
    {
      type: "machines",
      title: "Total Machines",
      value: stats.totalMachines || 0,
      borderColor: "border-l-blue-500",
      headerBg: "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
      textColor: "text-blue-700",
      iconColor: "text-blue-500",
      icon: <Settings className="h-4 w-4" />,
      description: "Asset distribution"
    },
    {
      type: "total_tasks",
      title: "Total Tasks",
      value: stats.totalTasks || 0,
      borderColor: "border-l-indigo-500",
      headerBg: "bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900",
      textColor: "text-indigo-700",
      iconColor: "text-indigo-500",
      icon: <ClipboardList className="h-4 w-4" />,
      description: "All activities"
    },
    {
      type: "completed",
      title: "Tasks Complete",
      value: stats.completedTasks || 0,
      borderColor: "border-l-green-500",
      headerBg: "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
      textColor: "text-green-700",
      iconColor: "text-green-500",
      icon: <CheckCircle className="h-4 w-4" />,
      description: `${Math.round((stats.completedTasks / (stats.totalTasks || 1)) * 100)}% completion`
    },
    {
      type: "pending",
      title: "Tasks Pending",
      value: stats.pendingTasks || 0,
      borderColor: "border-l-amber-500",
      headerBg: "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900",
      textColor: "text-amber-700",
      iconColor: "text-amber-500",
      icon: <Clock className="h-4 w-4" />,
      description: "Awaiting action"
    },
    {
      type: "overdue",
      title: "Tasks Overdue",
      value: stats.overdueTasks || 0,
      borderColor: "border-l-red-500",
      headerBg: "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900",
      textColor: "text-red-700",
      iconColor: "text-red-500",
      icon: <AlertTriangle className="h-4 w-4" />,
      description: "Critical attention"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <div 
          key={index}
          onClick={() => onCardClick?.(card.type)}
          className={`bg-white rounded-lg border border-gray-200 ${card.borderColor} border-l-4 shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer transform hover:-translate-y-1 active:scale-95`}
        >
          <div className={`p-3 flex items-center justify-between ${card.headerBg} border-b border-gray-100`}>
             <span className={`text-[10px] font-bold ${card.textColor} uppercase tracking-tight truncate`}>
               {card.title}
             </span>
             <div className={`${card.iconColor}`}>
               {card.icon}
             </div>
          </div>
          <div className="p-3">
             <div className={`text-2xl font-bold ${card.textColor}`}>
               {card.value}
             </div>
             <p className={`text-[10px] ${card.textColor} opacity-80 mt-1 truncate`}>
               {card.description}
             </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
