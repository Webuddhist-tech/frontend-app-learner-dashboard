import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCompletionData } from 'data/services/lms/api';
import { actions } from 'data/redux/app/reducer';

import { useIntl } from '@edx/frontend-platform/i18n';

import { reduxHooks } from 'hooks';
import {
  CourseFilterControls,
} from 'containers/CourseFilterControls';
import CourseListSlot from 'plugin-slots/CourseListSlot';
import NoCoursesViewSlot from 'plugin-slots/NoCoursesViewSlot';

import { useCourseListData } from './hooks';

import messages from './messages';

import './index.scss';

const emphasize = chunks => <em>{chunks}</em>;

/**
 * Renders the list of CourseCards, as well as the controls (CourseFilterControls) for modifying the list.
 * Also houses the NoCoursesView to display if the user hasn't enrolled in any courses.
 * @returns List of courses as CourseCards or empty state
*/
export const CoursesPanel = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const hasCourses = reduxHooks.useHasCourses();
  const courseListData = useCourseListData();
  const courseData = useSelector(state => state.app.courseData || {});

  // Track which courses have been fetched to avoid duplicate calls
  const fetchedCoursesRef = React.useRef(new Set());
  // Track which courses have been initialized with empty completion
  const initializedCoursesRef = React.useRef(new Set());

  // Get all visible course info (both started and not started)
  const visibleCoursesInfo = React.useMemo(
    () => courseListData.visibleList
      .map(({ cardId }) => {
        const card = courseData[cardId];
        if (card?.courseKey) {
          return {
            courseKey: card.courseKey,
            hasStarted: card?.enrollment?.hasStarted || false,
          };
        }
        return null;
      })
      .filter(Boolean),
    [courseListData.visibleList, courseData],
  );

  // Create a stable string key for dependency checking (all visible courses)
  const visibleCourseIdsKey = visibleCoursesInfo
    .map(c => c.courseKey)
    .sort()
    .join(',');

  useEffect(() => {
    const { updateCourseCard, setCompletionPending } = actions;
    const load = async () => {
      // Set empty completion summary for courses that haven't started (only once)
      const notStartedCourses = visibleCoursesInfo.filter(
        ({ courseKey, hasStarted }) => !hasStarted && !initializedCoursesRef.current.has(courseKey),
      );

      notStartedCourses.forEach(({ courseKey }) => {
        initializedCoursesRef.current.add(courseKey);
        dispatch(updateCourseCard({
          courseId: courseKey,
          data: { completionSummary: { complete_count: 0, incomplete_count: 0, locked_count: 0 } },
        }));
      });

      // Filter out courses that have already been fetched (only started courses)
      const coursesToLoad = visibleCoursesInfo
        .filter(({ hasStarted, courseKey }) => hasStarted && !fetchedCoursesRef.current.has(courseKey))
        .map(({ courseKey }) => courseKey);

      if (!coursesToLoad.length) {
        return;
      }

      // Mark these courses as being fetched
      coursesToLoad.forEach(courseId => fetchedCoursesRef.current.add(courseId));

      dispatch(setCompletionPending(true));
      try {
        const { data } = await getCompletionData({ courseIds: coursesToLoad });
        Object.entries(data).forEach(([courseKey, summary]) => {
          dispatch(updateCourseCard({ courseId: courseKey, data: { completionSummary: summary } }));
        });
      } catch (err) {
        // If there's an error, remove from fetched set so it can be retried
        coursesToLoad.forEach(courseId => fetchedCoursesRef.current.delete(courseId));
      } finally {
        dispatch(setCompletionPending(false));
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, visibleCourseIdsKey]);

  return (
    <div className="course-list-container">
      <div className="course-list-heading-container">
        <h2 className="course-list-title">
          {formatMessage(messages.myCourses, { em: emphasize })}
        </h2>
        <div className="course-filter-controls-container">
          <CourseFilterControls {...courseListData.filterOptions} />
        </div>
      </div>
      {hasCourses ? <CourseListSlot courseListData={courseListData} /> : <NoCoursesViewSlot />}
    </div>
  );
};

CoursesPanel.propTypes = {};

export default CoursesPanel;
