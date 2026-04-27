import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('EventCategory (e2e)', () => {
  let app: INestApplication;
  let createdCategoryId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/event-category (POST)', () => {
    it('should create a new event category', () => {
      return request(app.getHttpServer())
        .post('/event-category')
        .send({
          categoryName: 'Văn hóa E2E Test',
          description: 'Test description',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('EC', 1);
          expect(res.body).toHaveProperty('EM', 'Create event category successfully');
          expect(res.body.data).toHaveProperty('categoryId');
          createdCategoryId = res.body.data.categoryId;
        });
    });

    it('should fail when categoryName is missing', () => {
      return request(app.getHttpServer())
        .post('/event-category')
        .send({
          description: 'Test description',
        })
        .expect(400);
    });

    it('should fail when creating duplicate category', () => {
      const categoryData = {
        categoryName: 'Duplicate Category',
        description: 'Test',
      };

      // Tạo lần 1
      return request(app.getHttpServer())
        .post('/event-category')
        .send(categoryData)
        .expect(201)
        .then(() => {
          // Tạo lần 2 với cùng tên
          return request(app.getHttpServer())
            .post('/event-category')
            .send(categoryData)
            .expect(201)
            .expect((res) => {
              expect(res.body).toHaveProperty('EC', 0);
              expect(res.body.EM).toContain('already exists');
            });
        });
    });
  });

  describe('/event-category (GET)', () => {
    it('should return all event categories', () => {
      return request(app.getHttpServer())
        .get('/event-category')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('EC', 1);
          expect(res.body.data).toHaveProperty('categories');
          expect(Array.isArray(res.body.data.categories)).toBe(true);
        });
    });
  });

  describe('/event-category/:id (GET)', () => {
    it('should return a specific event category', async () => {
      // Giả sử đã có category từ test trước
      const categories = await request(app.getHttpServer()).get('/event-category').expect(200);

      if (categories.body.data.categories.length > 0) {
        const categoryId = categories.body.data.categories[0].categoryId;

        return request(app.getHttpServer())
          .get(`/event-category/${categoryId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('EC', 1);
            expect(res.body).toHaveProperty('categoryId', categoryId);
          });
      }
    });

    it('should return 400 for invalid UUID', () => {
      return request(app.getHttpServer()).get('/event-category/invalid-uuid').expect(400);
    });

    it('should return error for non-existent category', () => {
      return request(app.getHttpServer())
        .get('/event-category/123e4567-e89b-12d3-a456-426614174999')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('EC', 0);
          expect(res.body.EM).toContain('not found');
        });
    });
  });

  describe('/event-category/:id (PATCH)', () => {
    it('should update an event category', async () => {
      // Tạo category mới để test update
      const createRes = await request(app.getHttpServer())
        .post('/event-category')
        .send({
          categoryName: 'Update Test Category',
          description: 'Original description',
        })
        .expect(201);

      const categoryId = createRes.body.data.categoryId;

      return request(app.getHttpServer())
        .patch(`/event-category/${categoryId}`)
        .send({
          categoryName: 'Updated Category Name',
          description: 'Updated description',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('EC', 1);
          expect(res.body.EM).toContain('Update Event Category Success');
        });
    });

    it('should return 404 when updating non-existent category', () => {
      return request(app.getHttpServer())
        .patch('/event-category/123e4567-e89b-12d3-a456-426614174999')
        .send({
          categoryName: 'Updated Name',
        })
        .expect(404);
    });
  });

  describe('/event-category/:id (DELETE)', () => {
    it('should delete an event category', async () => {
      // Tạo category để test delete
      const createRes = await request(app.getHttpServer())
        .post('/event-category')
        .send({
          categoryName: 'Delete Test Category',
          description: 'To be deleted',
        })
        .expect(201);

      const categoryId = createRes.body.data.categoryId;

      return request(app.getHttpServer())
        .delete(`/event-category/${categoryId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('EC', 1);
          expect(res.body.EM).toContain('Delete Event Category Success');
        });
    });

    it('should return 404 when deleting non-existent category', () => {
      return request(app.getHttpServer())
        .delete('/event-category/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);
    });
  });
});
