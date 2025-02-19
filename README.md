# Svelte VATSIM Stands

A Svelte component to display VATSIM stand occupancy.

## Preview

![image](https://github.com/user-attachments/assets/b4287ed3-15c3-4100-ba5a-f4970b9816e9)

## Installation

```bash
npm install svelte-vatsim-stands
```

## Usage

2 example usages are availible

- 1 A minimal example [src/routes/minimal/+page.svelte](src/routes/minimal/+page.svelte).
- 2 An example with a custom tooltip defined [src/routes/+page.svelte](src/routes/+page.svelte).

### Stand source

A publicly accessible txt file following the EuroScope sectorfile format is required to be passed to the component.
`[N/S]DDD.MM.SS.mmm:[E/W]DDD.MM.SS.mmm:LABEL` is the format of each line in the file.

Empty lines and lines starting with `;` are ignored.

Exapmle files can be seen in [static/test-stands](static/test-stands).

## Thresholds

A few thresholds are defined

Pilots with the following conditions are considered not to be at the airport:

- Ground speed greater than **1**.
- Callsing includes `_`.
- Further than **10km** from the defined centerpoint.

All stands within **40m** of the pilot are considered occupied.
