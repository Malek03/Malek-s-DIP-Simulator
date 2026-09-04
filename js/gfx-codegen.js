/* ============================================================
   Vision Studio — Advanced Graphics Module
   Code Generator: Python / PyOpenGL
   ============================================================ */

const GfxCodegen = (() => {
  'use strict';

  function generate2DShapes(params) {
    const r1 = (params.color1[0]).toFixed(2);
    const g1 = (params.color1[1]).toFixed(2);
    const b1 = (params.color1[2]).toFixed(2);

    const r2 = (params.color2[0]).toFixed(2);
    const g2 = (params.color2[1]).toFixed(2);
    const b2 = (params.color2[2]).toFixed(2);

    const r3 = (params.color3[0]).toFixed(2);
    const g3 = (params.color3[1]).toFixed(2);
    const b3 = (params.color3[2]).toFixed(2);

    return `import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *

def draw_triangle():
    glBegin(GL_TRIANGLES)
    # النقطة الأولى
    glColor3f(${r1}, ${g1}, ${b1})
    glVertex2f(-1.0, -1.0)
    
    # النقطة الثانية
    glColor3f(${r2}, ${g2}, ${b2})
    glVertex2f(1.0, -1.0)
    
    # النقطة الثالثة
    glColor3f(${r3}, ${g3}, ${b3})
    glVertex2f(0.0, 1.0)
    glEnd()

def main():
    pygame.init()
    display = (800, 600)
    pygame.display.set_mode(display, DOUBLEBUF | OPENGL)
    pygame.display.set_caption("2D Shapes and Transformations")

    # إعداد الإسقاط المتوازي (Orthographic)
    gluOrtho2D(-3.0, 3.0, -3.0, 3.0)

    clock = pygame.time.Clock()
    angle = 0.0 

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return

        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        
        glPushMatrix()
        
        # الإزاحة والتكبير والتدوير
        glTranslatef(${params.translateX.toFixed(1)}, ${params.translateY.toFixed(1)}, 0.0)
        glScalef(${params.scale.toFixed(1)}, ${params.scale.toFixed(1)}, 1.0)
        
        ${params.animate ? `glRotatef(angle, 0, 0, 1)` : `glRotatef(${params.rotateZ.toFixed(1)}, 0, 0, 1)`}
        
        draw_triangle()
        
        glPopMatrix()

        ${params.animate ? `angle += ${params.speed.toFixed(1)}` : ``}

        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()`;
  }

  function generate3DShapes(params) {
    let faces = '';
    for(let i=0; i<6; i++) {
        let c = params.faceColors[i];
        faces += `    (${c[0].toFixed(2)}, ${c[1].toFixed(2)}, ${c[2].toFixed(2)}),\n`;
    }

    return `import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *

# رؤوس المكعب
vertices = (
    (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, -1),
    (1, -1, 1), (1, 1, 1), (-1, -1, 1), (-1, 1, 1)
)

edges = (
    (0,1), (0,3), (0,4), (2,1), (2,3), (2,7),
    (6,3), (6,4), (6,7), (5,1), (5,4), (5,7)
)

surfaces = (
    (0,1,2,3), (3,2,7,6), (6,7,5,4),
    (4,5,1,0), (1,5,7,2), (4,0,3,6)
)

colors = (
${faces})

def draw_cube():
${params.showFaces ? `
    # رسم الأوجه الملونة
    glBegin(GL_QUADS)
    for i, surface in enumerate(surfaces):
        glColor3fv(colors[i])
        for vertex in surface:
            glVertex3fv(vertices[vertex])
    glEnd()
` : ''}${params.showEdges ? `
    # رسم الحواف
    glLineWidth(2)
    glBegin(GL_LINES)
    glColor3f(0, 0, 0)
    for edge in edges:
        for vertex in edge:
            glVertex3fv(vertices[vertex])
    glEnd()
` : ''}

def main():
    pygame.init()
    display = (800, 600)
    pygame.display.set_mode(display, DOUBLEBUF | OPENGL)
    pygame.display.set_caption("3D Shapes")

    glEnable(GL_DEPTH_TEST)

    # إعداد الكاميرا
    ${params.projection === 'perspective' 
        ? `gluPerspective(${params.fov}, (display[0]/display[1]), 0.1, 50.0)`
        : `glOrtho(-4, 4, -3, 3, 0.1, 50.0)`}
    
    glTranslatef(0.0, 0.0, -${params.cameraZ.toFixed(1)})

    clock = pygame.time.Clock()
    angle = 0.0

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return

        glClearColor(0.9, 0.9, 0.9, 1.0)
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        
        glPushMatrix()

        glTranslatef(${params.translateX.toFixed(1)}, ${params.translateY.toFixed(1)}, ${params.translateZ.toFixed(1)})
        glScalef(${params.scale.toFixed(1)}, ${params.scale.toFixed(1)}, ${params.scale.toFixed(1)})
        
        ${params.animate ? `
        glRotatef(angle * ${params.animX ? 1 : 0}, 1, 0, 0)
        glRotatef(angle * ${params.animY ? 1 : 0}, 0, 1, 0)
        glRotatef(angle * ${params.animZ ? 1 : 0}, 0, 0, 1)
        ` : `
        glRotatef(${params.rotateX.toFixed(1)}, 1, 0, 0)
        glRotatef(${params.rotateY.toFixed(1)}, 0, 1, 0)
        glRotatef(${params.rotateZ.toFixed(1)}, 0, 0, 1)
        `}
        
        draw_cube()
        glPopMatrix()

        ${params.animate ? `angle += ${params.speed.toFixed(1)}` : ``}

        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()`;
  }

  function generateIllumination(params) {
    return `import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *

def setup_lighting():
    ${params.lightEnabled ? `glEnable(GL_LIGHTING)
    glEnable(GL_LIGHT0)
    glEnable(GL_DEPTH_TEST)
    glShadeModel(GL_SMOOTH)

    # 1. إعداد مصدر الضوء
    light_ambient = [${params.lightAmbient.map(c=>c.toFixed(2)).join(', ')}]
    light_diffuse = [${params.lightDiffuse.map(c=>c.toFixed(2)).join(', ')}]
    light_specular = [${params.lightSpecular.map(c=>c.toFixed(2)).join(', ')}]
    light_position = [${params.lightPos[0].toFixed(1)}, ${params.lightPos[1].toFixed(1)}, ${params.lightPos[2].toFixed(1)}, 1.0]

    glLightfv(GL_LIGHT0, GL_AMBIENT, light_ambient)
    glLightfv(GL_LIGHT0, GL_DIFFUSE, light_diffuse)
    glLightfv(GL_LIGHT0, GL_SPECULAR, light_specular)
    glLightfv(GL_LIGHT0, GL_POSITION, light_position)

    # 2. إعداد المادة
    mat_ambient = [${params.matAmbient.map(c=>c.toFixed(2)).join(', ')}]
    mat_diffuse = [${params.matDiffuse.map(c=>c.toFixed(2)).join(', ')}]
    mat_specular = [${params.matSpecular.map(c=>c.toFixed(2)).join(', ')}]
    shininess = [${params.matShininess.toFixed(1)}]

    glMaterialfv(GL_FRONT, GL_AMBIENT, mat_ambient)
    glMaterialfv(GL_FRONT, GL_DIFFUSE, mat_diffuse)
    glMaterialfv(GL_FRONT, GL_SPECULAR, mat_specular)
    glMaterialfv(GL_FRONT, GL_SHININESS, shininess)` : `# الإضاءة معطلة`}

def draw_sphere():
    quadric = gluNewQuadric()
    gluQuadricNormals(quadric, GLU_SMOOTH)
    gluSphere(quadric, 1.5, 32, 32)

def main():
    pygame.init()
    display = (800, 600)
    pygame.display.set_mode(display, DOUBLEBUF | OPENGL)
    pygame.display.set_caption("Illumination and Surface")

    gluPerspective(45, (display[0]/display[1]), 0.1, 50.0)
    glTranslatef(0.0, 0.0, -5.0)

    setup_lighting()
    clock = pygame.time.Clock()
    angle = 0.0

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return

        glClearColor(0.1, 0.1, 0.15, 1.0)
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)

        glPushMatrix()
        ${params.animate ? `glRotatef(angle, 1, 1, 0)` : `
        glRotatef(${params.rotateX.toFixed(1)}, 1, 0, 0)
        glRotatef(${params.rotateY.toFixed(1)}, 0, 1, 0)
        `}
        draw_sphere()
        glPopMatrix()

        ${params.animate ? `angle += ${params.speed.toFixed(1)}` : ``}
        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()`;
  }

  function generateFog(params) {
    let modeStr = params.fogMode === 0 ? "GL_LINEAR" : params.fogMode === 1 ? "GL_EXP" : "GL_EXP2";
    
    return `import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *
import random

def setup_fog():
    glEnable(GL_DEPTH_TEST)
    ${params.fogEnabled ? `
    glEnable(GL_FOG)
    
    fog_color = [${params.fogColor.map(c=>c.toFixed(2)).join(', ')}]
    glFogfv(GL_FOG_COLOR, fog_color)
    glFogi(GL_FOG_MODE, ${modeStr})
    glFogf(GL_FOG_DENSITY, ${params.fogDensity.toFixed(3)})
    
    glClearColor(fog_color[0], fog_color[1], fog_color[2], 1.0)
    ` : `
    glClearColor(0.0, 0.0, 0.0, 1.0)
    `}

def draw_cube():
    glBegin(GL_QUADS)
    for surface in ((0,1,2,3), (3,2,7,6), (6,7,5,4), (4,5,1,0), (1,5,7,2), (4,0,3,6)):
        for vertex in surface:
            vertices = ((0.5, -0.5, -0.5), (0.5, 0.5, -0.5), (-0.5, 0.5, -0.5), (-0.5, -0.5, -0.5),
                        (0.5, -0.5, 0.5), (0.5, 0.5, 0.5), (-0.5, -0.5, 0.5), (-0.5, 0.5, 0.5))
            glVertex3fv(vertices[vertex])
    glEnd()

def main():
    pygame.init()
    display = (800, 600)
    pygame.display.set_mode(display, DOUBLEBUF | OPENGL)
    pygame.display.set_caption("Atmospheric Effects - FOG")

    gluPerspective(45, (display[0]/display[1]), 0.1, 50.0)
    setup_fog()

    # إنشاء مكعبات عشوائية
    cubes = []
    for _ in range(${params.fogCount}):
        cubes.append([random.uniform(-4, 4), random.uniform(-3, 3), random.uniform(-2, -15)])

    clock = pygame.time.Clock()

    glEnable(GL_LIGHTING)
    glEnable(GL_LIGHT0)
    glEnable(GL_COLOR_MATERIAL)
    glColorMaterial(GL_FRONT, GL_AMBIENT_AND_DIFFUSE)

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return

        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)

        for pos in cubes:
            glPushMatrix()
            glTranslatef(pos[0], pos[1], pos[2])
            
            ${params.animate ? `glRotatef(pygame.time.get_ticks() * 0.05, 1, 1, 0)` : ``}
            
            glColor3f(0.2, 0.6, 1.0)
            draw_cube()
            glPopMatrix()
            
            ${params.animate ? `
            # حركة نحو الكاميرا
            pos[2] += ${params.speed.toFixed(2)} * 0.05
            if pos[2] > 2:
                pos[2] = random.uniform(-15, -20)
            ` : ``}

        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()`;
  }

  return {
    generateCode: (sceneType, params) => {
      switch (sceneType) {
        case '2d': return generate2DShapes(params);
        case '3d': return generate3DShapes(params);
        case 'lighting': return generateIllumination(params);
        case 'fog': return generateFog(params);
        default: return '# Error generating code';
      }
    }
  };

})();
