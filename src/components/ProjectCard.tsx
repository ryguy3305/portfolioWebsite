import Image from 'next/image';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

interface ProjectCardProps {
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
}

const DevpostIcon = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#003E54"/>
    <path d="M8.5 10.5L16 25.5L23.5 10.5H8.5Z" fill="white"/>
    <path d="M16 13.5L19.5 20.5H12.5L16 13.5Z" fill="#003E54"/>
  </svg>
);

const ProjectCard = ({
  title,
  subtitle,
  description,
  imageUrl,
  technologies,
  githubUrl,
  liveUrl
}: ProjectCardProps) => {
  // Check if the liveUrl is a Devpost link
  const isDevpost = liveUrl && liveUrl.includes('devpost.com');

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg overflow-hidden h-full">
      <div className="relative h-48 w-full">
        <Image
          src={imageUrl}
          alt={`${title} project screenshot`}
          fill
          className="object-cover"
        />
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">{title}</h3>
        {subtitle && (
          <div className="text-sm text-blue-600 font-medium mb-2">{subtitle}</div>
        )}
        <p className="text-gray-600 mb-4 flex-grow">{description}</p>
        
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <FaGithub className="h-5 w-5" />
              <span>Code</span>
            </a>
          )}
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              {isDevpost ? <DevpostIcon /> : <FaExternalLinkAlt className="h-4 w-4" />}
              <span>{isDevpost ? 'Devpost' : 'Live Demo'}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard; 