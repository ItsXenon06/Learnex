package com.studentsocial.backend.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.UUID;

/**
 * Single source of truth for the course catalog.
 *
 * TO ADD A NEW COURSE:
 *   1. Add a row to the COURSES array below.
 *   2. Restart the backend — the seeder inserts any missing rows automatically.
 *   3. That's it. CourseService reads from the DB so the course appears everywhere.
 *
 * TO ADD A NEW DEPARTMENT:
 *   1. Define a new DEPT_* UUID constant.
 *   2. Add an insertDept() call in seedDepartments().
 *   3. Use the new constant in a COURSES row.
 */
@Slf4j
@Component
public class CourseDataSeeder implements ApplicationRunner {

    @PersistenceContext
    private EntityManager em;

    private final TransactionTemplate tx;

    public CourseDataSeeder(PlatformTransactionManager txManager) {
        this.tx = new TransactionTemplate(txManager);
        this.tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    // ── Infrastructure UUIDs ──────────────────────────────────────────────
    private static final UUID SCHOOL_TYPE_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final UUID SCHOOL_ID      = UUID.fromString("00000000-0000-0000-0000-000000000010");
    private static final UUID FACULTY_ID     = UUID.fromString("00000000-0000-0000-0000-000000000020");

    // ── Department UUIDs ──────────────────────────────────────────────────
    private static final UUID DEPT_CS   = UUID.fromString("00000000-0000-0000-0000-000000000031");
    private static final UUID DEPT_MATH = UUID.fromString("00000000-0000-0000-0000-000000000032");
    private static final UUID DEPT_ENG  = UUID.fromString("00000000-0000-0000-0000-000000000033");
    private static final UUID DEPT_STAT = UUID.fromString("00000000-0000-0000-0000-000000000034");
    private static final UUID DEPT_PHYS = UUID.fromString("00000000-0000-0000-0000-000000000035");
    private static final UUID DEPT_BUS  = UUID.fromString("00000000-0000-0000-0000-000000000036");

    // ─────────────────────────────────────────────────────────────────────
    // ✏️  EDIT THIS TABLE TO ADD / REMOVE COURSES
    // Columns: { courseId, department, code, name, credits, level }
    // ─────────────────────────────────────────────────────────────────────
    private static final Object[][] COURSES = {
        { "00000000-0000-0000-0000-000000000001", DEPT_CS,   "CS301",   "Data Structures & Algorithms", (short)3, "undergraduate" },
        { "00000000-0000-0000-0000-000000000002", DEPT_MATH, "MATH201", "Linear Algebra",               (short)3, "undergraduate" },
        { "00000000-0000-0000-0000-000000000003", DEPT_CS,   "CS401",   "Operating Systems",            (short)3, "undergraduate" },
        { "00000000-0000-0000-0000-000000000004", DEPT_ENG,  "ENG102",  "Technical Writing",            (short)2, "undergraduate" },
        { "00000000-0000-0000-0000-000000000005", DEPT_CS,   "CS201",   "Computer Networks",            (short)3, "undergraduate" },
        { "00000000-0000-0000-0000-000000000006", DEPT_STAT, "STAT301", "Probability & Statistics",     (short)3, "undergraduate" },
        // ── Add new courses below ─────────────────────────────────────────
        // { "00000000-0000-0000-0000-000000000007", DEPT_PHYS, "PHYS101", "Classical Mechanics",       (short)3, "undergraduate" },
        // { "00000000-0000-0000-0000-000000000008", DEPT_BUS,  "BUS201",  "Principles of Marketing",   (short)3, "undergraduate" },
    };

    // ─────────────────────────────────────────────────────────────────────

    @Override
    public void run(ApplicationArguments args) {
        step("school_type",  this::seedSchoolType);
        step("school",       this::seedSchool);
        step("faculty",      this::seedFaculty);
        step("departments",  this::seedDepartments);
        step("courses",      this::seedCourses);
    }

    /** Runs the given block in a brand-new, independent transaction.
     *  Uses TransactionTemplate directly so Spring's proxy self-invocation
     *  problem doesn't apply — @Transactional on same-class methods is ignored. */
    private void step(String name, Runnable block) {
        try {
            tx.executeWithoutResult(status -> block.run());
        } catch (Exception e) {
            // Warn but continue — a pre-existing row in any step should not
            // prevent later steps (departments, courses) from running.
            log.warn("CourseDataSeeder [{}] skipped — {}", name, rootMessage(e));
        }
    }

    // ── Seed methods (plain, no @Transactional — transaction comes from step()) ──

    private void seedSchoolType() {
        // school_type has a unique constraint on BOTH id AND name.
        // Conflict on name is the one that fires when the row was created by
        // script.sql with a different UUID. Upsert on name so we always succeed.
        em.createNativeQuery("""
            INSERT INTO school_type (id, name, level, description)
            VALUES (CAST(:id AS uuid), :name, 'tertiary', 'University-level institution')
            ON CONFLICT (name) DO UPDATE SET level = EXCLUDED.level
            """)
          .setParameter("id",   SCHOOL_TYPE_ID.toString())
          .setParameter("name", "University")
          .executeUpdate();
        log.debug("CourseDataSeeder [school_type] ok");
    }

    private void seedSchool() {
        // Look up the real school_type id by name — may differ from our seed UUID
        Object typeIdRaw = em.createNativeQuery(
                "SELECT id FROM school_type WHERE name = 'University' LIMIT 1")
            .getSingleResult();

        em.createNativeQuery("""
            INSERT INTO school (id, name, type_id, is_verified)
            VALUES (CAST(:id AS uuid), :name, CAST(:typeId AS uuid), true)
            ON CONFLICT (id) DO NOTHING
            """)
          .setParameter("id",     SCHOOL_ID.toString())
          .setParameter("name",   "Learnex University")
          .setParameter("typeId", typeIdRaw.toString())
          .executeUpdate();
        log.debug("CourseDataSeeder [school] ok");
    }

    private void seedFaculty() {
        em.createNativeQuery("""
            INSERT INTO faculty (id, school_id, name)
            VALUES (CAST(:id AS uuid), CAST(:schoolId AS uuid), :name)
            ON CONFLICT (id) DO NOTHING
            """)
          .setParameter("id",       FACULTY_ID.toString())
          .setParameter("schoolId", SCHOOL_ID.toString())
          .setParameter("name",     "Faculty of Science & Engineering")
          .executeUpdate();
        log.debug("CourseDataSeeder [faculty] ok");
    }

    private void seedDepartments() {
        insertDept(DEPT_CS,   "Computer Science", "CS");
        insertDept(DEPT_MATH, "Mathematics",      "MATH");
        insertDept(DEPT_ENG,  "English",          "ENG");
        insertDept(DEPT_STAT, "Statistics",       "STAT");
        insertDept(DEPT_PHYS, "Physics",          "PHYS");
        insertDept(DEPT_BUS,  "Business",         "BUS");
        log.debug("CourseDataSeeder [departments] ok");
    }

    private void seedCourses() {
        int inserted = 0;
        for (Object[] row : COURSES) {
            String id      = (String) row[0];
            UUID   deptId  = (UUID)   row[1];
            String code    = (String) row[2];
            String name    = (String) row[3];
            short  credits = (short)  row[4];
            String level   = (String) row[5];

            int n = em.createNativeQuery("""
                INSERT INTO course (id, department_id, code, name, credits, level)
                VALUES (CAST(:id AS uuid), CAST(:dept AS uuid), :code, :name, :credits, :level)
                ON CONFLICT (id) DO NOTHING
                """)
                .setParameter("id",      id)
                .setParameter("dept",    deptId.toString())
                .setParameter("code",    code)
                .setParameter("name",    name)
                .setParameter("credits", credits)
                .setParameter("level",   level)
                .executeUpdate();
            inserted += n;
        }
        log.info("CourseDataSeeder [courses]: {} inserted, {} already existed.",
                inserted, COURSES.length - inserted);
    }

    // ─────────────────────────────────────────────────────────────────────

    private void insertDept(UUID id, String name, String code) {
        em.createNativeQuery("""
            INSERT INTO department (id, faculty_id, name, code)
            VALUES (CAST(:id AS uuid), CAST(:facultyId AS uuid), :name, :code)
            ON CONFLICT (id) DO NOTHING
            """)
          .setParameter("id",        id.toString())
          .setParameter("facultyId", FACULTY_ID.toString())
          .setParameter("name",      name)
          .setParameter("code",      code)
          .executeUpdate();
    }

    private static String rootMessage(Throwable t) {
        Throwable cause = t;
        while (cause.getCause() != null) cause = cause.getCause();
        return cause.getMessage();
    }
}