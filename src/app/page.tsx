import Image from "next/image";

export default function HomePage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Create Your Cursor Project Starter Kit
      </h1>

      {/* Form sections will go here */}
      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold mb-4">Project Details</h2>
          {/* Project Description, Problem, Features, Users Inputs */}
          <p className="text-gray-500">[Project Details Form Placeholder]</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Technology Stack</h2>
          {/* Tech Stack Selection */}
          <p className="text-gray-500">[Tech Stack Form Placeholder]</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Generation Options</h2>
          {/* Rules, Specs, Checklist Selection */}
          <p className="text-gray-500">[Generation Options Form Placeholder]</p>
        </section>

        <div className="text-center mt-12">
          {/* Submit Button */}
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
            Create Starter Kit
          </button>
        </div>
      </div>
    </main>
  );
}
