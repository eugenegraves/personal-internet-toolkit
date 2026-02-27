import { App } from '../components/App';
import { Dropdown } from '../components/Dropdown';
import { Head } from '../components/Head';
import { PerfPanel } from '../components/PerfPanel';

type ReactExampleProps = {
	initialCount: number;
	cssPath: string;
};

export const ReactExample = ({ initialCount, cssPath }: ReactExampleProps) => (
	<html lang="en">
		<Head cssPath={cssPath} />
		<body>
			<header>
				<a href="/">AbsoluteJS</a>
				<Dropdown />
			</header>
			<App initialCount={initialCount} />
			<PerfPanel />
		</body>
	</html>
);
