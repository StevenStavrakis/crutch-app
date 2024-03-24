import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
    y?: number;
    x?: number;
    start?: number;
    duration?: number;
};

export function calcDistance(s:[number, number], d:[number, number]){
    return Math.sqrt( (s[0] - d[0]) ** 2 + (s[1] - d[1]) ** 2 );
}

export const flyAndScale = (
    node: Element,
    params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
    const style = getComputedStyle(node);
    const transform = style.transform === "none" ? "" : style.transform;

    const scaleConversion = (
        valueA: number,
        scaleA: [number, number],
        scaleB: [number, number]
    ) => {
        const [minA, maxA] = scaleA;
        const [minB, maxB] = scaleB;

        const percentage = (valueA - minA) / (maxA - minA);
        const valueB = percentage * (maxB - minB) + minB;

        return valueB;
    };

    const styleToString = (
        style: Record<string, number | string | undefined>
    ): string => {
        return Object.keys(style).reduce((str, key) => {
            if (style[key] === undefined) return str;
            return str + `${key}:${style[key]};`;
        }, "");
    };

    return {
        duration: params.duration ?? 200,
        delay: 0,
        css: (t) => {
            const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
            const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
            const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

            return styleToString({
                transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                opacity: t
            });
        },
        easing: cubicOut
    };
};

export function addCircleBackground(svgString: string, backgroundColor: string, strokeColor: string, padding: number): string {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    const viewBox = svgElement.getAttribute('viewBox');
    const [, , width, height] = viewBox ? viewBox.split(' ') : [0, 0, svgElement.getAttribute('width'), svgElement.getAttribute('height')];

    const widthNum = Number(width);
    const heightNum = Number(height);
    const size = Math.max(widthNum, heightNum) + padding * 2;

    const circleElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circleElement.setAttribute('cx', String(size / 2));
    circleElement.setAttribute('cy', String(size / 2));
    circleElement.setAttribute('r', String((size / 2) - 2)); // Adjust the radius to account for padding
    circleElement.setAttribute('fill', backgroundColor);
    circleElement.setAttribute('stroke', strokeColor);
    circleElement.setAttribute('stroke-width', '2');

    const groupElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
    groupElement.setAttribute('transform', `translate(${padding}, ${padding})`); // Adjust the translation to account for padding

    while (svgElement.firstChild) {
        groupElement.appendChild(svgElement.firstChild);
    }

    const pathElements = groupElement.getElementsByTagName('path');
    for (let i = 0; i < pathElements.length; i++) {
        pathElements[i].setAttribute('fill', 'none'); // Remove the fill attribute
        pathElements[i].setAttribute('stroke', strokeColor);
    }


    const newSvgElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    newSvgElement.setAttribute('width', String(size));
    newSvgElement.setAttribute('height', String(size));
    newSvgElement.setAttribute('viewBox', `0 0 ${size} ${size}`);
    newSvgElement.appendChild(circleElement);
    newSvgElement.appendChild(groupElement);

    return new XMLSerializer().serializeToString(newSvgElement);
}
};
