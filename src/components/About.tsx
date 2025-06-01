import Image from 'next/image';

const About = () => {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          About Me
        </h2>
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 relative">
              <Image
                src="/facePhoto.png"
                alt="Ryan"
                fill
                className="object-cover rounded-full shadow-lg"
                priority
              />
            </div>
            <div className="flex-1">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Hi, I&apos;m Ryan! I&apos;m a Computer Science & Engineering student with a passion for building things that make an impact—whether that&apos;s through machine learning models, full stack applications, or community events.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Outside of the classroom, I love competing in and organizing hackathons. I currently help lead outreach efforts for OHI/O, where I get to support and inspire other students to dive into tech through hands-on events. When I&apos;m not coding, you can probably find me playing volleyball with friends or brainstorming the next side project.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                I&apos;m especially interested in machine learning and full stack development, and I&apos;m always looking for opportunities to grow as both an engineer and a teammate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About; 