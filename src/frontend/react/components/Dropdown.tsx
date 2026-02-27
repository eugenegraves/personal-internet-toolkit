export const Dropdown = () => (
	<details
		onPointerEnter={(event) => {
			if (event.pointerType === 'mouse') {
				event.currentTarget.open = true;
			}
		}}
		onPointerLeave={(event) => {
			if (event.pointerType === 'mouse') {
				event.currentTarget.open = false;
			}
		}}
	>
		<summary>Pages</summary>
		<nav>
			<a href="/react">React</a>
			<a href="/html">HTML</a>
			<a href="/htmx">HTMX</a>
			<a href="/svelte">Svelte</a>
			<a href="/vue">Vue</a>
		</nav>
	</details>
);
