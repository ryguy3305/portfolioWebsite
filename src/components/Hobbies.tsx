import { FaDumbbell, FaBook, FaMusic, FaLaptopCode, FaVolleyballBall } from 'react-icons/fa';
import { GiSurfBoard } from 'react-icons/gi';

interface Hobby {
  name: string;
  description: string;
  icon: React.ReactNode;
}

const hobbies: Hobby[] = [
  {
    name: "Paddleboarding",
    description: "I enjoy paddleboarding with friends during the summer months, just don't ask about the time we lost a paddle",
    icon: <GiSurfBoard className="w-8 h-8" />
  },
  {
    name: "Music",
    description: "No matter where I am I will probably be listening to music, some of my favorite artists are Porter Robinson New Jeans",
    icon: <FaMusic className="w-8 h-8" />
  },
  {
    name: "Hackathons",
    description: "If there is a hackathon on campus you will see me there, either participating or organizing",
    icon: <FaLaptopCode className="w-8 h-8" />
  },
  {
    name: "Reading",
    description: "I've recently been getting back into reading, mostly nonfiction and biographies",
    icon: <FaBook className="w-8 h-8" />
  },
  {
    name: "Lifting",
    description: "I try to get in the gym at least once a day even if it is just for a quick workout",
    icon: <FaDumbbell className="w-8 h-8" />
  },
  {
    name: "Volleyball",
    description: "Volleyball is me and my friends' go-to weekend activity and we have participated in intramural for 2 years",
    icon: <FaVolleyballBall className="w-8 h-8" />
  }
];

const Hobbies = () => {
  return (
    <section id="hobbies" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Hobbies & Interests
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hobbies.map((hobby, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-lg p-6 transform hover:scale-105 transition-transform duration-300 ease-in-out"
            >
              <div className="flex items-center mb-4">
                <div className="text-blue-600 mr-4">
                  {hobby.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {hobby.name}
                </h3>
              </div>
              <p className="text-gray-600">
                {hobby.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hobbies; 