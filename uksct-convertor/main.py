import os
import re
import sys
import requests
from datetime import datetime


def validate_url(url: str) -> str:
    pattern = re.compile(
        r"https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)"
    )
    match = pattern.match(url)
    if match:
        return url
    else:
        raise ValueError("Invalid URL format")


def download_file(url: str) -> str:
    res = requests.get(url, allow_redirects=True)

    if not res.ok:
        raise ValueError(f"Failed to download file from {url}")

    content = res.content.decode("utf-8")
    return "\n".join(line for line in content.splitlines() if line.strip())


def parse_file_content(content: str) -> dict:
    lines = content.splitlines()
    categories = {}
    current_category = None
    for line in lines:
        if line.startswith(";"):
            current_category = line[1:].strip()
            categories[current_category] = []
        elif current_category:
            categories[current_category].append(line.strip())

    return {k: "\n".join(v) for k, v in categories.items()}


def get_boolean_input(prompt: str) -> bool:
    while True:
        user_input = input(f"{prompt} (y/n): ").strip().lower()
        if user_input in ["y", "yes"]:
            return True
        elif user_input in ["n", "no"]:
            return False
        else:
            print("Invalid input. Please enter 'y' or 'n'.")


def parse_lines(lines: list[str]) -> list[str]:
    parsed_lines = []
    previous_stand = None

    for line in lines:
        label_match = re.search(r'"([^"]*)"', line)
        if label_match:
            label = label_match.group(1).strip()
        else:
            continue

        line = re.sub(r'"[^"]*"', "", line).strip()

        [lat, lon] = line.split(" ")[:2]

        print(f"Label: {label}, Lat: {lat}, Lon: {lon}")

        if not label:
            print(f"Skipping line with empty label: {line}")
            print(label)
            continue

        if label in ["L", "R", "C"] and previous_stand:
            label = f"{previous_stand}{label}"
        elif label not in ["L", "R", "C"]:
            previous_stand = label
        else:
            print(f"Skipping line with invalid label: {line}")
            continue

        parsed_line = f"{lat}:{lon}:{label}"
        parsed_lines.append(parsed_line)

    return parsed_lines


def dump_to_out_file(lines: list[str]) -> None:
    os.makedirs("out", exist_ok=True)
    with open(f"out/{datetime.now().strftime('%d-%m-%Y_%H-%M-%S')}.txt", "w") as f:
        for line in lines:
            f.write(f"{line}\n")
    print(f"Parsed lines saved to out/{int(os.path.getmtime(__file__))}.txt")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <action>")
        sys.exit(1)

    action = sys.argv[1]

    match action:
        case "manual":
            url = validate_url(input("Enter the URL: "))

            file_content = download_file(url)
            parsed_content = parse_file_content(file_content)

            included_categories = []
            for category, lines in parsed_content.items():
                if get_boolean_input(
                    f"Include '{category}': {len(lines.splitlines())} lines?"
                ):
                    included_categories.append(category)

            lines_to_parse = []
            for category in included_categories:
                lines_to_parse.extend(parsed_content[category].splitlines())

            parsed_lines = parse_lines(lines_to_parse)

            dump_to_out_file(parsed_lines)

        case "ci":
            if len(sys.argv) < 3:
                print("Usage: python main.py ci <url>")
                sys.exit(1)

            url = validate_url(sys.argv[2])
            file_content = download_file(url)
            parsed_content = parse_file_content(file_content)

            lines_to_parse = []
            for category, lines in parsed_content.items():
                lines_to_parse.extend(lines.splitlines())

            parsed_lines = parse_lines(lines_to_parse)

            dump_to_out_file(parsed_lines)

        case _:
            print("Invalid action. Use 'manual' or 'ci'.")
            sys.exit(1)
