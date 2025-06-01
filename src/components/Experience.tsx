import ExperienceItem from './ExperienceItem';

const experiences = [
  {
    companyName: "Vertiv",
    role: "Computer Engineering Intern",
    duration: "May 2025 - Present",
    description: [
      "Check in later! Still in progress"
    ],
    logoUrl: "/vertiv_logo.jpg",
    companyUrl: "https://www.vertiv.com"
  }
];

const Experience = () => {
  return (
    <section id="experience" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Experience
        </h2>
        <div className="space-y-8">
          {experiences.map((experience, index) => (
            <ExperienceItem
              key={index}
              {...experience}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience; 