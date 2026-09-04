import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *

# تعريف رؤوس المكعب (8 نقاط)
vertices = (
    (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, -1),
    (1, -1, 1), (1, 1, 1), (-1, -1, 1), (-1, 1, 1)
)

# تعريف الخطوط التي تربط الرؤوس
edges = (
    (0,1), (0,3), (0,4), (2,1), (2,3), (2,7),
    (6,3), (6,4), (6,7), (5,1), (5,4), (5,7)
)

# تعريف أوجه المكعب لتلوينها
surfaces = (
    (0,1,2,3), (3,2,7,6), (6,7,5,4),
    (4,5,1,0), (1,5,7,2), (4,0,3,6)
)

colors = (
    (1,0,0), (0,1,0), (0,0,1),
    (1,1,0), (1,0,1), (0,1,1)
)

def draw_cube():
    # رسم الأسطح الملونة
    glBegin(GL_QUADS)
    for i, surface in enumerate(surfaces):
        glColor3fv(colors[i])
        for vertex in surface:
            glVertex3fv(vertices[vertex])
    glEnd()
    
    # رسم الحواف باللون الأسود لتوضيح الشكل
    glLineWidth(3)
    glBegin(GL_LINES)
    glColor3f(0, 0, 0)
    for edge in edges:
        for vertex in edge:
            glVertex3fv(vertices[vertex])
    glEnd()

def main():
    pygame.init()
    display = (800, 600)
    pygame.display.set_mode(display, DOUBLEBUF | OPENGL)
    pygame.display.set_caption("3D Shapes and Perspective Projection")

    # تفعيل اختبار العمق
    glEnable(GL_DEPTH_TEST)

    # ضبط الإسقاط المنظوري (Perspective)
    # (زاوية الرؤية 45، نسبة الأبعاد، أقرب مسافة للرؤية، أبعد مسافة)
    gluPerspective(45, (display[0]/display[1]), 0.1, 50.0)
    
    # تحريك الكاميرا للخلف قليلاً لنتمكن من رؤية المكعب
    glTranslatef(0.0, 0.0, -7.0)

    clock = pygame.time.Clock()

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return

        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)

        # تدوير المكعب حول أكثر من محور
        glRotatef(1, 1, 1, 1)
        
        draw_cube()

        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()