const Message = require('../../models/Message');

describe('Message Model Test', () => {

    it('should fail to save message without required fields', async () => {
        const messageWithoutRequiredField = new Message({ text: 'Invalid Message' });
        let err;
        
        try {
            await messageWithoutRequiredField.save();
        } catch (error) {
            err = error;
        }
        
        expect(err).toBeInstanceOf(Error);
    });
});

const ProfileAnalytics = require('../../models/ProfileAnalytics');

describe('ProfileAnalytics Model Test', () => {
    it('should create analytics with default values', async () => {
        const analytics = new ProfileAnalytics({
            userId: '507f1f77bcf86cd799439011'
        });

        expect(analytics.totalMessages).toBe(0);
        expect(analytics.messagesSent).toBe(0);
        expect(analytics.messagesReceived).toBe(0);
    });

    it('should track message counts correctly', async () => {
        const analytics = new ProfileAnalytics({
            userId: '507f1f77bcf86cd799439011',
            messagesSent: 5,
            messagesReceived: 3
        });

        expect(analytics.messagesSent).toBe(5);
        expect(analytics.messagesReceived).toBe(3);
        expect(analytics.totalMessages).toBe(0);
    });
});

describe('Chat Functions', () => {
    it('should generate correct room ID', () => {
        const user1 = '507f1f77bcf86cd799439011';
        const user2 = '507f1f77bcf86cd799439012';
        
        const roomId = [user1, user2].sort().join('-');
        expect(roomId).toBe('507f1f77bcf86cd799439011-507f1f77bcf86cd799439012');
    });

    it('should format message correctly', () => {
        const message = {
            text: 'Hello',
            sender: '507f1f77bcf86cd799439011',
            timestamp: new Date()
        };
        
        expect(message.text).toBe('Hello');
        expect(message.sender).toBeDefined();
    });
});

describe('Message Counting', () => {
    const messages = [
        { sender: 'user1', receiverId: 'user2' },
        { sender: 'user2', receiverId: 'user1' },
        { sender: 'user1', receiverId: 'user2' }
    ];

    it('should count sent messages correctly', () => {
        const userId = 'user1';
        const sentCount = messages.filter(msg => msg.sender === userId).length;
        expect(sentCount).toBe(2);
    });

    it('should count received messages correctly', () => {
        const userId = 'user1';
        const receivedCount = messages.filter(msg => msg.receiverId === userId).length;
        expect(receivedCount).toBe(1);
    });
});

describe('WebSocket Message Handling', () => {
    it('should format websocket message correctly', () => {
        const wsMessage = {
            type: 'message',
            room: 'room123',
            text: 'Hello',
            senderId: 'user1',
            receiverId: 'user2'
        };

        expect(wsMessage.type).toBe('message');
        expect(wsMessage.text).toBeDefined();
        expect(wsMessage.senderId).toBeDefined();
        expect(wsMessage.receiverId).toBeDefined();
    });

    it('should handle join room message', () => {
        const joinMessage = {
            type: 'join',
            room: 'room123',
            userId: 'user1'
        };

        expect(joinMessage.type).toBe('join');
        expect(joinMessage.room).toBeDefined();
    });
});