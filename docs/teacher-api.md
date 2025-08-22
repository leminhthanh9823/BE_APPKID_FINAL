# Teacher API Documentation

## Get All Teachers (with Pagination)

### Endpoint

```
POST /api/users/teachers
```

### Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body

```json
{
  "pageNumb": 1,
  "pageSize": 10,
  "searchTerm": ""
}
```

### Response

```json
{
  "success": true,
  "status": 200,
  "data": {
    "records": [
      {
        "id": 1,
        "role_id": 2,
        "name": "Nguyễn Văn A",
        "email": "teacher1@example.com",
        "phone": "0123456789",
        "username": "teacher1",
        "gender": "male",
        "status": true,
        "dob": "1990-01-01",
        "created_at": "2025-01-01",
        "updated_at": "2025-01-01"
      }
    ],
    "total_record": 25,
    "total_page": 3
  },
  "message": "Lấy danh sách giáo viên thành công"
}
```

## Get Teacher List (Simple - for Dropdowns)

### Endpoint

```
GET /api/users/teachers/list
```

### Headers

```
Authorization: Bearer <JWT_TOKEN>
```

### Response

```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "id": 1,
      "name": "Nguyễn Văn A",
      "email": "teacher1@example.com",
      "phone": "0123456789"
    },
    {
      "id": 2,
      "name": "Trần Thị B",
      "email": "teacher2@example.com",
      "phone": "0987654321"
    }
  ],
  "message": "Lấy danh sách giáo viên thành công"
}
```

## Usage Examples

### JavaScript Fetch Examples

#### Get Teachers with Pagination

```javascript
const getTeachers = async (page = 1, pageSize = 10, search = "") => {
  try {
    const response = await fetch("/api/users/teachers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        pageNumb: page,
        pageSize: pageSize,
        searchTerm: search,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching teachers:", error);
  }
};
```

#### Get Simple Teacher List

```javascript
const getTeacherList = async () => {
  try {
    const response = await fetch("/api/users/teachers/list", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    const data = await response.json();
    return data.data; // Returns array of teachers
  } catch (error) {
    console.error("Error fetching teacher list:", error);
  }
};
```

### cURL Examples

#### Get Teachers with Pagination

```bash
curl -X POST http://localhost:3000/api/users/teachers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "pageNumb": 1,
    "pageSize": 10,
    "searchTerm": "nguyen"
  }'
```

#### Get Simple Teacher List

```bash
curl -X GET http://localhost:3000/api/users/teachers/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Configuration Notes

### Role ID Configuration

The teacher role ID is currently set to `2` in the controller. You may need to adjust this based on your role system:

```javascript
const teacherRoleId = 2; // Change this to match your teacher role ID
```

### Common Role IDs (adjust as needed)

- Admin: 1
- Teacher: 2
- Student/Parent: 3

## Error Responses

### Authentication Error

```json
{
  "success": false,
  "message": "Unauthorized",
  "status": 401
}
```

### Server Error

```json
{
  "success": false,
  "status": 500,
  "message": "Lỗi khi lấy danh sách giáo viên",
  "error": "Database connection failed"
}
```
