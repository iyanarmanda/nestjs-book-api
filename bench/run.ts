import 'config/env/production';
import autocannon from 'autocannon';

export function runBench(queries: string) {
	const url = `http://localhost:${process.env.PORT}/api/books?${queries}`;

	const instance = autocannon(
		{
			url,
			connections: 10,
			duration: 30,
		},
		(err, _res) => {
			if (err) {
				console.error(err);
				process.exit(1);
			}

			console.log('Benchmark finished');
		},
	);

	autocannon.track(instance, {
		renderProgressBar: true,
	});
}
