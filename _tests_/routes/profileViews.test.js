const mongoose = require('mongoose');
const ProfileView = require('../../models/ProfileView');

describe('Profile Views Tests', () => {
    const mockViewData = {
        profileId: '507f1f77bcf86cd799439012',
        viewerId: '507f1f77bcf86cd799439011',
        source: 'direct'
    };

    describe('Profile View Model Test', () => {

        it('should fail to save profile view without required fields', () => {
            const profileViewWithoutRequiredField = new ProfileView({ source: 'direct' });
            const err = profileViewWithoutRequiredField.validateSync();
            expect(err).toBeTruthy();
        });
    });

    describe('Profile View Statistics Tests', () => {
        const mockViews = [
            { profileId: 'profile1', viewerId: 'viewer1', source: 'direct' },
            { profileId: 'profile1', viewerId: 'viewer2', source: 'search' },
            { profileId: 'profile1', viewerId: 'viewer1', source: 'direct' }
        ];

        it('should count total views correctly', () => {
            const totalViews = mockViews.length;
            expect(totalViews).toBe(3);
        });

        it('should count unique viewers correctly', () => {
            const uniqueViewers = [...new Set(mockViews.map(view => view.viewerId))];
            expect(uniqueViewers.length).toBe(2);
        });

        it('should calculate return rate correctly', () => {
            const viewerCounts = {};
            mockViews.forEach(view => {
                viewerCounts[view.viewerId] = (viewerCounts[view.viewerId] || 0) + 1;
            });
            
            const returnViewers = Object.values(viewerCounts).filter(count => count > 1).length;
            const totalViewers = Object.keys(viewerCounts).length;
            const returnRate = returnViewers / totalViewers;

            expect(returnRate).toBe(0.5);
        });
    });

    describe('View Source Analysis', () => {
        const mockViews = [
            { profileId: 'profile1', viewerId: 'viewer1', source: 'direct' },
            { profileId: 'profile1', viewerId: 'viewer2', source: 'search' },
            { profileId: 'profile1', viewerId: 'viewer3', source: 'direct' }
        ];

        it('should count views by source correctly', () => {
            const viewsBySource = mockViews.reduce((acc, view) => {
                acc[view.source] = (acc[view.source] || 0) + 1;
                return acc;
            }, {});

            expect(viewsBySource.direct).toBe(2);
            expect(viewsBySource.search).toBe(1);
        });
    });

    describe('Trend Analysis', () => {
        it('should analyze view trends correctly', () => {
            const mockTrendData = [
                { date: '2024-01-01', views: 5 },
                { date: '2024-01-02', views: 8 },
                { date: '2024-01-03', views: 6 }
            ];

            const totalViews = mockTrendData.reduce((sum, day) => sum + day.views, 0);
            const averageViews = totalViews / mockTrendData.length;

            expect(totalViews).toBe(19);
            expect(averageViews).toBe(19/3);
        });
    });

    describe('Error Cases', () => {
        it('should handle invalid source type', () => {
            const invalidView = new ProfileView({
                ...mockViewData,
                source: 'invalid_source'
            });

            const err = invalidView.validateSync();
            expect(err).toBeTruthy();
        });

        it('should validate ObjectId fields', () => {
            const invalidView = new ProfileView({
                ...mockViewData,
                profileId: 'invalid-id'
            });

            const err = invalidView.validateSync();
            expect(err).toBeTruthy();
        });
    });
});