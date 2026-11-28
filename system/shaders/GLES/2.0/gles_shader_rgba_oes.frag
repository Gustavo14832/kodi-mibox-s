/*
 *      Copyright (C) 2010-2013 Team XBMC
 *      http://xbmc.org
 *
 *  This Program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2, or (at your option)
 *  any later version.
 *
 *  This Program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with XBMC; see the file COPYING.  If not, see
 *  <http://www.gnu.org/licenses/>.
 *
 */

#version 100

#extension GL_OES_EGL_image_external : require

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
uniform highp mat4 m_coord0Matrix;
uniform vec3 m_videoDetail; // inverse visible dimensions, signed detail control
#else
precision mediump float;
#endif
uniform samplerExternalOES m_samp0;
varying vec4 m_cord0;

uniform float m_brightness;
uniform float m_contrast;

void main ()
{
  vec4 rgb;

  rgb = texture2D(m_samp0, m_cord0.xy);
#ifdef GL_FRAGMENT_PRECISION_HIGH
  if (m_videoDetail.z != 0.0)
  {
    // SurfaceTexture supplies the transform from visible video to decoder storage.
    // Bound every neighbour to the transformed crop, including flipped textures.
    vec2 axisX = m_coord0Matrix[0].xy;
    vec2 axisY = m_coord0Matrix[1].xy;
    vec2 dx = axisX * m_videoDetail.x;
    vec2 dy = axisY * m_videoDetail.y;
    vec2 center = (m_coord0Matrix * vec4(0.5, 0.5, 0.0, 1.0)).xy;
    vec2 halfSize = 0.5 * (abs(axisX) + abs(axisY) - abs(dx) - abs(dy));
    vec2 lo = center - halfSize;
    vec2 hi = center + halfSize;
    vec2 uv = m_cord0.xy;
    vec3 l = texture2D(m_samp0, clamp(uv - dx, lo, hi)).rgb;
    vec3 r = texture2D(m_samp0, clamp(uv + dx, lo, hi)).rgb;
    vec3 t = texture2D(m_samp0, clamp(uv - dy, lo, hi)).rgb;
    vec3 b = texture2D(m_samp0, clamp(uv + dy, lo, hi)).rgb;
    vec3 lowest = min(rgb.rgb, min(min(l, r), min(t, b)));
    vec3 highest = max(rgb.rgb, max(max(l, r), max(t, b)));
    vec3 detail = rgb.rgb - 0.25 * (l + r + t + b);
    float gate = smoothstep(0.008, 0.030, dot(highest - lowest, vec3(0.2126, 0.7152, 0.0722)));
    rgb.rgb = clamp(rgb.rgb + m_videoDetail.z * gate * detail, lowest, highest);
  }
#endif
  rgb *= m_contrast;
  rgb += m_brightness;

  gl_FragColor = rgb;
}
