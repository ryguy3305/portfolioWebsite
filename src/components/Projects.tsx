import ProjectCard from './ProjectCard';

const projects = [
  {
    title: "EyeDentify",
    subtitle: "BoilerMake XII Roboflow Challenge Winner (February 2025)",
    description: `Built a real-time web app using a Roboflow-trained computer vision model and React.js to detect signs of eye strain (e.g., redness, puffiness) and notify users to take breaks.\nLed dataset curation and model training pipeline using Kaggle data, achieving reliable performance and laying the foundation for future integration with blink detection and user analytics.`,
    imageUrl: "/eyedetection.jpg",
    technologies: ["React.js", "Roboflow", "Computer Vision", "Kaggle"],
    githubUrl: undefined,
    liveUrl: "https://devpost.com/software/eyedentify-3leky5"
  },
  {
    title: "Market Regime-Based Trading Strategy",
    subtitle: "SIAM2I/Nationwide Quantathon Winner (March 2025)",
    description: `Designed and implemented a predictive asset allocation strategy using Python, Random Forests, and logistic regression to classify market regimes and dynamically rebalance equity/bond exposure, achieving a 46.8% return with a Sharpe Ratio of 0.70.\nConducted statistical testing, signal engineering (volatility, entropy, bond yield trends), and risk management to outperform buy-and-hold strategies in risk-adjusted terms, reducing drawdown by 50% compared to the S&P 500.`,
    imageUrl: "/strategytrades.png",
    technologies: ["Python", "Random Forest", "Logistic Regression", "Quantitative Finance"],
    githubUrl: "https://github.com/MaddoxCRoy/QuantHackathon25",
    liveUrl: undefined
  }
];

const Projects = () => {
  return (
    <section id="projects" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <ProjectCard
              key={index}
              {...project}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects; 