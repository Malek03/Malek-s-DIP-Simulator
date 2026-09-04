import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *

def setup_lighting_and_material():
    # تفعيل الإضاءة
    glEnable(GL_LIGHTING)
    glEnable(GL_LIGHT0) # تفعيل مصدر الضوء الأول
    glEnable(GL_DEPTH_TEST) # تفعيل اختبار العمق
    glShadeModel(GL_SMOOTH) # تظليل ناعم للأسطح (الأسبوع 13)

    # 1. إعداد خصائص مصدر الضوء (الأسبوع 11)
    light_ambient = [0.2, 0.2, 0.2, 1.0] # إضاءة محيطية خافتة
    light_diffuse = [0.8, 0.8, 0.8, 1.0] # إضاءة منتشرة بيضاء
    light_specular = [1.0, 1.0, 1.0, 1.0] # لمعان أبيض ناصع
    light_position = [5.0, 5.0, 5.0, 1.0] # موقع الضوء (في الزاوية العلوية)

    glLightfv(GL_LIGHT0, GL_AMBIENT, light_ambient)
    glLightfv(GL_LIGHT0, GL_DIFFUSE, light_diffuse)
    glLightfv(GL_LIGHT0, GL_SPECULAR, light_specular)
    glLightfv(GL_LIGHT0, GL_POSITION, light_position)

    # 2. إعداد خصائص المادة/السطح (الأسبوع 13)
    # لنجعل السطح يبدو كالبلاستيك اللامع أو المعدن الملون
    mat_ambient = [0.7, 0.1, 0.1, 1.0] # لون السطح في الظل (أحمر داكن)
    mat_diffuse = [0.9, 0.2, 0.2, 1.0] # لون السطح المعرض للضوء (أحمر ساطع)
    mat_specular = [1.0, 1.0, 1.0, 1.0] # لون اللمعان المنعكس
    shininess = [50.0] # قوة اللمعان (كلما زاد الرقم صغرت بقعة الضوء)

    glMaterialfv(GL_FRONT, GL_AMBIENT, mat_ambient)
    glMaterialfv(GL_FRONT, GL_DIFFUSE, mat_diffuse)
    glMaterialfv(GL_FRONT, GL_SPECULAR, mat_specular)
    glMaterialfv(GL_FRONT, GL_SHININESS, shininess)

def draw_sphere():
    # استخدام GLU لرسم كرة (يقوم تلقائياً بحساب الـ Normals المطلوبة للإضاءة)
    quadric = gluNewQuadric()
    gluQuadricNormals(quadric, GLU_SMOOTH)
    gluSphere(quadric, 1.5, 32, 32) # نصف القطر 1.5، دقة الرسم 32x32

def main():
    pygame.init()
    display = (800, 600)
    pygame.display.set_mode(display, DOUBLEBUF | OPENGL)
    pygame.display.set_caption("Illumination and Surface Rendering")

    gluPerspective(45, (display[0]/display[1]), 0.1, 50.0)
    glTranslatef(0.0, 0.0, -5.0)

    setup_lighting_and_material()
    clock = pygame.time.Clock()
    angle = 0

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return

        # لون خلفية داكن لإبراز الإضاءة
        glClearColor(0.1, 0.1, 0.1, 1.0)
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)

        glPushMatrix()
        glRotatef(angle, 1, 1, 0) # تدوير الكرة لمشاهدة تفاعل الضوء مع السطح
        draw_sphere()
        glPopMatrix()

        angle += 1
        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()