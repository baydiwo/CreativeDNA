import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Image as ImageIcon, FileVideo, Trophy, XCircle } from 'lucide-react';
import { CreativeType } from '@/lib/services/creatives.service';

export type CreativeNodeData = {
  id: string;
  name: string;
  type: CreativeType;
  status: 'pending' | 'winner' | 'loser';
  storageUrl?: string;
  onClick: (id: string) => void;
};

function CreativeNode({ data, isConnectable }: NodeProps) {
  const { id, name, type, status, storageUrl, onClick } = data as unknown as CreativeNodeData;

  const getStatusConfig = () => {
    switch (status) {
      case 'winner':
        return {
          borderColor: 'border-green-500',
          badgeBg: 'bg-green-100',
          badgeText: 'text-green-700',
          icon: <Trophy className="h-3 w-3 mr-1" />
        };
      case 'loser':
        return {
          borderColor: 'border-red-500',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-700',
          icon: <XCircle className="h-3 w-3 mr-1" />
        };
      default:
        return {
          borderColor: 'border-slate-300',
          badgeBg: 'bg-slate-100',
          badgeText: 'text-slate-600',
          icon: null
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={`relative w-48 rounded-lg border-2 bg-white shadow-sm transition-all hover:shadow-md cursor-pointer ${config.borderColor}`}
      onClick={() => onClick(id)}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-400"
      />
      
      <div className="p-1">
        <div className="aspect-video w-full overflow-hidden rounded bg-slate-100 relative group flex items-center justify-center">
          {type === 'image' && storageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={storageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <FileVideo className="h-6 w-6 mb-1" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-medium">View Details</span>
          </div>
        </div>

        <div className="mt-2 px-1 pb-1">
          <p className="text-xs font-semibold text-slate-900 truncate" title={name}>
            {name}
          </p>
          <div className="mt-1 flex items-center">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${config.badgeBg} ${config.badgeText}`}>
              {config.icon}
              <span className="capitalize">{status}</span>
            </span>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-400"
      />
    </div>
  );
}

export default memo(CreativeNode);
