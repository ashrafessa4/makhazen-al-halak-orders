
import { Badge } from '@/components/ui/badge';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CategoryFilter = ({ categories, selectedCategory, onCategorySelect }: CategoryFilterProps) => {
  return (
    <div className="flex justify-center mb-8 sm:mb-10">
      <div className="flex flex-wrap gap-3 justify-center bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border-2 border-gray-100">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className={`cursor-pointer px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold transition-all duration-200 transform hover:scale-105 ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-barber-blue to-barber-green hover:from-barber-blue/90 hover:to-barber-green/90 text-white shadow-lg border-none'
                : 'bg-white text-barber-dark border-2 border-barber-blue/30 hover:bg-barber-blue/10 hover:border-barber-blue shadow-md'
            }`}
            onClick={() => onCategorySelect(category)}
          >
            {category}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
