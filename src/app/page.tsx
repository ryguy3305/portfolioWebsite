const previously = [
  { text: "SWE Intern at Vertiv, Columbus, Summer 2025", bold: true },
  { text: "Led MakeOHI/O 2026", desc: "Ohio State's largest hardware-focused hackathon, 250+ attendees", link: "https://hack.osu.edu/make/2026" },
  { text: "1st Place Nationwide SIAM2I Quantathon, March 2025", desc: "Check out our presentation", link: "https://www.youtube.com/watch?v=4dQUfS9YN8w" },
  { text: "1st Place Boilermake XII Roboflow Track, Feb. 2025", desc: "View our Devpost submission", link: "https://devpost.com/software/eyedentify-3leky5" },
];

const upcoming = [
  { text: "SWE Intern at Wells Fargo, Summer 2026", bold: true },
  { text: "Leading HackOHI/O 2026" },
  { text: "Graduating Spring 2027" },
];

function Section({
  title,
  items,
}: {
  title: string;
  items: { text: string; bold?: boolean; desc?: string; link?: string }[];
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-neutral-700 mb-3">{title}</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.text}>
            <div className={`flex items-center gap-2 ${item.bold ? "text-neutral-900 font-medium" : "text-neutral-600"}`}>
              {item.bold && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />}
              {item.text}
            </div>
            {item.desc && (
              <p className="text-sm text-neutral-400 mt-0.5">
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-600 underline transition-colors">
                    {item.desc}
                  </a>
                ) : item.desc}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen px-6 md:px-20 lg:px-40">
      <div className="max-w-md w-full space-y-10 py-20">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold">Ryan Jackman</h1>
          <div className="text-neutral-600 space-y-0.5">
            <p>CSE @ Ohio State &middot; Class of 2027</p>
            <p>President of OHI/O</p>
            <p>Vice President of CSE Peer Mentors</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <a
              href="mailto:your@email.com"
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Email
            </a>
            <a
              href="https://www.linkedin.com/in/rcjackman/"
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/ryguy3305"
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="/resume.pdf"
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Resume
            </a>
          </div>
        </header>

        <Section title="Upcoming" items={upcoming} />
        <Section title="Previously" items={previously} />
      </div>
    </main>
  );
}
