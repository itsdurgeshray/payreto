import { useEffect, useRef } from "react";
import { heroGlow } from "./heroGlowState";

// Light-ray shader behind the hero (the media-shader "rays" fragment shader,
// run on a plain WebGL2 canvas so its uniforms can be driven live).
//
// Colour adaptability: the two ray colours rest in the brand blues and blend
// toward whichever tile group is hovered (heroGlow), exactly as the old CSS
// rays did. The canvas covers the full stage and is feathered out at the
// bottom with a mask, so the rays never end on a hard edge.

const VERT = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

// Only the parts of the supplied shader that contribute to the output are
// kept (its noise / colour-space helpers were never called).
const FRAG = `#version 300 es
precision highp float;
out vec4 glFragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_colors[2];
uniform float u_intensity;
uniform float u_rays;
uniform float u_reach;
uniform float u_gain;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed)
{
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (.45 + 0.15 * sin(cosAngle * seedA + u_time * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + u_time * speed)),
    u_reach, 1.0) *
    clamp((u_resolution.x - length(sourceToCoord)) / u_resolution.x, u_reach, 1.0);
}

void main()
{
  vec2 coord = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  float speed = u_rays * 10.0;

  vec2 rayPos1 = vec2(u_resolution.x * 0.7, u_resolution.y * -0.4);
  vec2 rayRefDir1 = normalize(vec2(1.0, -0.116));
  float raySeedA1 = 36.2214 * speed;
  float raySeedB1 = 21.11349 * speed;
  float raySpeed1 = 1.5 * speed;

  vec2 rayPos2 = vec2(u_resolution.x * 0.8, u_resolution.y * -0.6);
  vec2 rayRefDir2 = normalize(vec2(1.0, 0.241));
  float raySeedA2 = 22.39910 * speed;
  float raySeedB2 = 18.0234 * speed;
  float raySpeed2 = 1.1 * speed;

  vec4 rays1 = rayStrength(rayPos1, rayRefDir1, coord, raySeedA1, raySeedB1, raySpeed1) * u_colors[0];
  vec4 rays2 = rayStrength(rayPos2, rayRefDir2, coord, raySeedA2, raySeedB2, raySpeed2) * u_colors[1];
  vec4 fragColor = rays1 + rays2;

  float brightness = 1.0 * u_reach - (coord.y / u_resolution.y);
  fragColor *= (brightness + (0.5 + u_intensity));
  // Overall gain keeps the rays atmospheric rather than a solid glow.
  glFragColor = clamp(fragColor * u_gain, 0.0, 1.0);
}`;

// Resting uniforms, from the supplied component.
const REST_COLORS: [number, number, number][] = [
  [0.23137254901960785, 0.5098039215686274, 0.9647058823529412],
  [0.33725490196078434, 0.3764705882352941, 1],
];
// Toned down from the supplied 0.946 so the rays stay behind the copy.
const INTENSITY = 0.35;
// Global output gain (1 = as supplied).
const GAIN = 0.55;
const RAYS = 0.094;
const REACH = 0.211;
// Rays are soft, so rendering below device resolution is invisible and cheap.
const RENDER_SCALE = 0.5;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", { premultipliedAlpha: false, antialias: false });
    if (!canvas || !gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Full-screen triangle.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(prog, "u_resolution"),
      time: gl.getUniformLocation(prog, "u_time"),
      colors: gl.getUniformLocation(prog, "u_colors"),
      intensity: gl.getUniformLocation(prog, "u_intensity"),
      rays: gl.getUniformLocation(prog, "u_rays"),
      reach: gl.getUniformLocation(prog, "u_reach"),
      gain: gl.getUniformLocation(prog, "u_gain"),
    };
    gl.uniform1f(u.rays, RAYS);
    gl.uniform1f(u.reach, REACH);
    gl.uniform1f(u.gain, GAIN);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * RENDER_SCALE;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Smoothed hover colour (same easing as the previous rays).
    const cur = { r: 96, g: 165, b: 250, i: 0 };
    const start = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      cur.r += (heroGlow.targetR - cur.r) * 0.06;
      cur.g += (heroGlow.targetG - cur.g) * 0.06;
      cur.b += (heroGlow.targetB - cur.b) * 0.06;
      cur.i += (heroGlow.targetIntensity - cur.i) * 0.07;

      // Skip drawing when the stage has faded the rays out entirely.
      const visible = Number(getComputedStyle(canvas.parentElement!).opacity) > 0.01;
      if (visible) {
        const hover = [cur.r / 255, cur.g / 255, cur.b / 255];
        const colors = new Float32Array(8);
        REST_COLORS.forEach((c, k) => {
          // Second ray takes the hover colour slightly less, keeping depth.
          const amt = cur.i * (k === 0 ? 1 : 0.8);
          colors[k * 4 + 0] = c[0] + (hover[0] - c[0]) * amt;
          colors[k * 4 + 1] = c[1] + (hover[1] - c[1]) * amt;
          colors[k * 4 + 2] = c[2] + (hover[2] - c[2]) * amt;
          colors[k * 4 + 3] = 1;
        });
        gl.uniform4fv(u.colors, colors);
        gl.uniform1f(u.intensity, INTENSITY + cur.i * 0.3);
        gl.uniform1f(u.time, (now - start) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 w-full h-full"
        style={{
          // Feather out well before the copy and mosaic, no hard cut-off.
          maskImage: "linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.55) 30%, transparent 70%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.55) 30%, transparent 70%)",
        }}
      />
      {/* Soft dark pool behind the headline so the text always reads cleanly. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 38% at 50% 44%, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.35) 55%, rgba(10,10,10,0) 100%)",
        }}
      />
    </>
  );
}
