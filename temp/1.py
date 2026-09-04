import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *

def draw_triangle():
    glBegin(GL_TRIANGLES)
    glColor3f(1.0, 0.0, 0.0) # أحمر
    glVertex2f(-1.0, -1.0)
    
    glColor3f(0.0, 1.0, 0.0) # أخضر
    glVertex2f(1.0, -1.0)
    
    glColor3f(0.0, 0.0, 1.0) # أزرق
    glVertex2f(0.0, 1.0)
    glEnd()

def main():
    pygame.init()
    display = (800, 600)
    pygame.display.set_mode(display, DOUBLEBUF | OPENGL)
    pygame.display.set_caption("2D Shapes and Transformations")

    gluOrtho2D(-2.0, 2.0, -2.0, 2.0)

    clock = pygame.time.Clock()
    
    # 1. تعريف متغير الزاوية خارج حلقة التكرار
    angle = 0.0 

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return

        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        
        glPushMatrix()
        
        # 2. إعطاء قيمة الزاوية المتغيرة للدالة
        glRotatef(angle, 0, 0, 1)
        
        draw_triangle()
        
        glPopMatrix()

        # 3. زيادة قيمة الزاوية بمقدار درجة واحدة في كل إطار
        angle += 1.0 

        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()