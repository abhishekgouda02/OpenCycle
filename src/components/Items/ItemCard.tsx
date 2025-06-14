import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, User } from 'lucide-react';
import { Item } from '../../types';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/item/${item.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getConditionColor = (condition: Item['condition']) => {
    const colors = {
      'new': 'bg-green-100 text-green-800',
      'like-new': 'bg-blue-100 text-blue-800',
      'good': 'bg-yellow-100 text-yellow-800',
      'fair': 'bg-orange-100 text-orange-800',
      'poor': 'bg-red-100 text-red-800',
    };
    return colors[condition];
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group overflow-hidden"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="aspect-video bg-gray-200 overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
              <span className="text-sm">No image</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-1">
            {item.title}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
            {item.condition}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>{item.location}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatDate(item.created_at)}</span>
          </div>
        </div>

        {item.user && (
          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
            <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-teal-600" />
            </div>
            <span className="text-sm text-gray-700">{item.user.full_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemCard;