interface SkillCategory {
  name: string;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    name: "Programming Languages",
    skills: ["Java", "Python", "C/C++", "SQL", "JavaScript", "MATLAB"]
  },
  {
    name: "Web & Software Development",
    skills: ["HTML/CSS", "React.js", "Git", "VS Code", "Eclipse", "Google Colab", "Unity"]
  },
  {
    name: "Data & Analysis Tools",
    skills: ["pandas", "NumPy", "Matplotlib", "OpenCV", "scikit-learn", "Tableau", "Excel"]
  }
];

const Skills = () => {
  return (
    <section id="skills" className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Skills
        </h2>
        <div className="relative border-l-2 border-blue-200 pl-8">
          {skillCategories.map((category, index) => (
            <div key={index} className="mb-12 relative">
              {/* Step indicator */}
              <span className="absolute -left-5 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-md"></span>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{category.name}</h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill, skillIndex) => (
                  <span
                    key={skillIndex}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills; 