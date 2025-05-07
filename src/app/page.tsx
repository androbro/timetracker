import { HydrateClient } from "~/trpc/server";
import { TimeTracker } from "./_components/time-tracker";

export default async function Home() {
	return (
		<HydrateClient>
			<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
				<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
					<h1 className="font-extrabold text-5xl tracking-tight sm:text-[5rem]">
						Time <span className="text-[hsl(280,100%,70%)]">Tracker</span>
					</h1>
					<TimeTracker />
				</div>
			</main>
		</HydrateClient>
	);
}
