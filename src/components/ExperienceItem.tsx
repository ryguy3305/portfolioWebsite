import Image from 'next/image';

interface ExperienceItemProps {
  companyName: string;
  role: string;
  duration: string;
  description: string[];
  logoUrl: string;
  companyUrl?: string;
}

const ExperienceItem = ({
  companyName,
  role,
  duration,
  description,
  logoUrl,
  companyUrl
}: ExperienceItemProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-6 bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex-shrink-0 flex items-start justify-center md:justify-start">
        <div className="relative w-16 h-16 md:w-20 md:h-20">
          <Image
            src={logoUrl}
            alt={`${companyName} logo`}
            fill
            className="object-contain"
          />
        </div>
      </div>
      
      <div className="flex-grow">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {companyUrl ? (
                <a 
                  href={companyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                >
                  {companyName}
                </a>
              ) : (
                companyName
              )}
            </h3>
            <p className="text-lg font-medium text-gray-700">{role}</p>
          </div>
          <p className="text-sm text-gray-500 mt-1 md:mt-0">{duration}</p>
        </div>
        
        <ul className="list-disc list-inside space-y-2">
          {description.map((item, index) => (
            <li key={index} className="text-gray-600">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ExperienceItem; 