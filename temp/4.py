import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *
import random

def setup_fog():
    glEnable(GL_DEPTH_TEST)
    
    # 1. تفعيل تأثير الضباب
    glEnable(GL_FOG)
    
    # 2. تحديد لون الضباب (رمادي فاتح)
    fog_color = [0.5, 0.5, 0.5, 1.0]
    glFogfv(GL_FOG_COLOR, fog_color)
    
    # 3. اختيار معادلة الكثافة
    glFogi(GL_FOG_MODE, GL_EXP2)
    
    # 4. تحديد كثافة الضباب
    glFogf(GL_FOG_DENSITY, 0.15)
    
    # جعل لون خلفية الشاشة مطابقاً للون الضباب للحصول على دمج مثالي
    glClearColor(fog_color[0], fog_color[1], fog_color[2], fog_color[3])

def draw_simple_cube():
    glBegin(GL_QUADS)
    for surface in ((0,1,2,3), (3,2,7,6), (6,7,5,4), (4,5,1,0), (1,5,7,2), (4,0,3,6)):
        for vertex in surface:
            # رؤوس مكعب بسيط بحجم 1
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

    # إنشاء قائمة بإحداثيات عشوائية لعدة مكعبات بأعماق مختلفة
    cubes = []
    for _ in range(15):
        # x, y, z (z سالب ليكون داخل الشاشة)
        cubes.append([random.uniform(-4, 4), random.uniform(-3, 3), random.uniform(-2, -15)])

    clock = pygame.time.Clock()
    
    # تفعيل الإضاءة البسيطة حتى تظهر تفاصيل المكعبات مع الضباب
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

        # رسم جميع المكعبات
        for pos in cubes:
            glPushMatrix()
            # نقل المكعب إلى موقعه العشوائي
            glTranslatef(pos[0], pos[1], pos[2])
            # تدوير المكعبات بشكل مستمر
            glRotatef(pygame.time.get_ticks() * 0.05, 1, 1, 0)
            
            # تلوين المكعب (أزرق مثلاً)
            glColor3f(0.2, 0.6, 1.0)
            draw_simple_cube()
            glPopMatrix()
            
            # تحديث موقع Z للمكعبات لتبدو وكأنها تتحرك نحو الكاميرا (لتوضيح تأثير الضباب)
            pos[2] += 0.02
            if pos[2] > 2: # إذا اقترب جداً نعيده للخلف
                pos[2] = random.uniform(-15, -20)

        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()