import { tasks } from "./registry";

function TaskTaxonomy() {
  return (
    <ol className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-10">
      {tasks.map((task) => (
        <li key={task.id} className="flex flex-col gap-3">
          <h3 className="text-xl tracking-tight">{task.label}</h3>
          <p className="text-subtle">{task.definition}</p>
        </li>
      ))}
    </ol>
  );
}

export { TaskTaxonomy };
