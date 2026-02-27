<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const pattern = ref('(\\w+)@(\\w+)\\.(\\w+)');
const flags = ref('gi');
const testString = ref(`Contact us at hello@example.com or support@toolkit.dev
You can also reach admin@test.org for urgent matters.
Invalid emails: @missing.com, noat.sign, incomplete@`);

const regexError = ref<string | null>(null);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Debounced regex for flags or pattern changes
const debouncedPattern = ref(pattern.value);
const debouncedFlags = ref(flags.value);

watch([pattern, flags], ([newP, newF]) => {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		debouncedPattern.value = newP;
		debouncedFlags.value = newF;
	}, 200);
}, { immediate: false });

// Compiled regex
const regex = computed(() => {
	try {
		const r = new RegExp(debouncedPattern.value, debouncedFlags.value);
		regexError.value = null;
		return r;
	} catch (e) {
		regexError.value = (e as Error).message;
		return null;
	}
});

// Matches
const matches = computed(() => {
	if (!regex.value || !testString.value) return [];
	const results: { text: string; index: number; groups: string[] }[] = [];
	let match: RegExpExecArray | null;

	// Reset lastIndex for global regex
	const r = new RegExp(regex.value.source, regex.value.flags);

	if (r.global) {
		while ((match = r.exec(testString.value)) !== null) {
			results.push({
				text: match[0],
				index: match.index,
				groups: match.slice(1),
			});
			if (match[0].length === 0) r.lastIndex++; // prevent infinite loop
		}
	} else {
		match = r.exec(testString.value);
		if (match) {
			results.push({
				text: match[0],
				index: match.index,
				groups: match.slice(1),
			});
		}
	}

	return results;
});

const matchCount = computed(() => matches.value.length);

// Highlighted text with <mark> elements
const highlightedHtml = computed(() => {
	if (!regex.value || !testString.value || matches.value.length === 0) {
		return escapeHtml(testString.value);
	}

	const r = new RegExp(regex.value.source, regex.value.flags);
	const str = testString.value;
	let result = '';
	let lastIndex = 0;

	if (r.global) {
		let m: RegExpExecArray | null;
		while ((m = r.exec(str)) !== null) {
			result += escapeHtml(str.slice(lastIndex, m.index));
			result += `<mark class="regex-match">${escapeHtml(m[0])}</mark>`;
			lastIndex = m.index + m[0].length;
			if (m[0].length === 0) { r.lastIndex++; lastIndex = r.lastIndex; }
		}
	} else {
		const m = r.exec(str);
		if (m) {
			result += escapeHtml(str.slice(0, m.index));
			result += `<mark class="regex-match">${escapeHtml(m[0])}</mark>`;
			lastIndex = m.index + m[0].length;
		}
	}

	result += escapeHtml(str.slice(lastIndex));
	return result;
});

function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Available flag toggles
const flagOptions = [
	{ flag: 'g', label: 'Global', desc: 'Find all matches' },
	{ flag: 'i', label: 'Case Insensitive', desc: 'Ignore case' },
	{ flag: 'm', label: 'Multiline', desc: '^/$ match line start/end' },
	{ flag: 's', label: 'Dotall', desc: '. matches newlines' },
	{ flag: 'u', label: 'Unicode', desc: 'Unicode support' },
];

function toggleFlag(f: string) {
	if (flags.value.includes(f)) {
		flags.value = flags.value.replace(f, '');
	} else {
		flags.value += f;
	}
}
</script>

<template>
	<div class="page-shell">
		<nav class="nav-bar">
			<div class="nav-brand">⚡ <span class="nav-gradient">Personal Internet Toolkit</span></div>
			<div class="nav-links">
				<a href="/" class="nav-link">Home</a>
				<a href="/markdown" class="nav-link">Markdown</a>
				<a href="/json" class="nav-link">JSON</a>
				<a href="/diff" class="nav-link">Diff</a>
				<a href="/regex" class="nav-link nav-link--active">Regex</a>
				<a href="/convert" class="nav-link">Convert</a>
				<a href="/compress" class="nav-link">Compress</a>
			</div>
		</nav>

		<div class="tool-hdr">
			<h1 class="tool-hdr__title">Regex Playground</h1>
			<div class="tool-hdr__meta">
				<span class="fw-badge">Vue</span>
				<span>Live evaluation • Computed reactivity • Debounced execution</span>
			</div>
		</div>

		<main class="regex-body">
			<!-- Pattern Input -->
			<div class="regex-pattern">
				<div class="regex-pattern__input-wrap">
					<span class="regex-pattern__slash">/</span>
					<input
						v-model="pattern"
						type="text"
						class="regex-pattern__input"
						placeholder="Enter regex pattern..."
						spellcheck="false"
					/>
					<span class="regex-pattern__slash">/</span>
					<input
						v-model="flags"
						type="text"
						class="regex-pattern__flags"
						placeholder="flags"
						spellcheck="false"
					/>
				</div>
				<div class="regex-flags">
					<button
						v-for="opt in flagOptions"
						:key="opt.flag"
						class="regex-flag-btn"
						:class="{ 'regex-flag-btn--active': flags.includes(opt.flag) }"
						:title="opt.desc"
						@click="toggleFlag(opt.flag)"
					>
						{{ opt.flag }}
					</button>
				</div>
			</div>

			<!-- Error -->
			<div v-if="regexError" class="regex-error">
				⚠️ {{ regexError }}
			</div>

			<!-- Test String + Highlighted Output -->
			<div class="regex-split">
				<div class="regex-split__panel">
					<label class="regex-label">Test String</label>
					<textarea
						v-model="testString"
						class="regex-textarea"
						spellcheck="false"
						placeholder="Enter test string..."
					></textarea>
				</div>
				<div class="regex-split__panel">
					<label class="regex-label">
						Matches
						<span class="regex-match-count" v-if="matchCount > 0">
							{{ matchCount }} match{{ matchCount !== 1 ? 'es' : '' }}
						</span>
					</label>
					<div class="regex-highlight" v-html="highlightedHtml"></div>
				</div>
			</div>

			<!-- Match Details -->
			<div v-if="matches.length > 0" class="regex-details">
				<label class="regex-label">Match Details</label>
				<div class="regex-matches-list">
					<div
						v-for="(m, i) in matches"
						:key="i"
						class="regex-match-item"
					>
						<div class="regex-match-item__header">
							<span class="regex-match-item__index">#{{ i + 1 }}</span>
							<code class="regex-match-item__text">{{ m.text }}</code>
							<span class="regex-match-item__pos">index {{ m.index }}</span>
						</div>
						<div v-if="m.groups.length > 0" class="regex-match-item__groups">
							<span
								v-for="(g, gi) in m.groups"
								:key="gi"
								class="regex-group"
							>
								Group {{ gi + 1 }}: <code>{{ g }}</code>
							</span>
						</div>
					</div>
				</div>
			</div>
		</main>
	</div>
</template>



