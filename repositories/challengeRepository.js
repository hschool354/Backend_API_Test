const Challenge = require('../models/challenge');
const { Op } = require('sequelize'); // Import Op để sử dụng trong các điều kiện truy vấn phức tạp

class ChallengeRepository {
    /**
     * Tạo một thử thách mới.
     * @param {object} challengeData - Dữ liệu của thử thách cần tạo.
     * @returns {Promise<object>} - Đối tượng thử thách đã được tạo.
     * @throws {Error} - Ném lỗi nếu có vấn đề khi tạo thử thách.
     */
    async createChallenge(challengeData) {
        try {
            const challenge = await Challenge.create(challengeData);
            return challenge.toJSON();
        } catch (error) {
            // Ghi log lỗi ở đây nếu cần thiết, ví dụ: console.error(error);
            throw new Error(`Lỗi khi tạo thử thách: ${error.message}`);
        }
    }

    /**
     * Lấy tất cả các thử thách với các bộ lọc tùy chọn.
     * @param {object} filters - Các điều kiện lọc (ví dụ: { status: 'pending', community_member_id: 1 }).
     * @returns {Promise<Array<object>>} - Mảng các đối tượng thử thách.
     * @throws {Error} - Ném lỗi nếu có vấn đề khi lấy danh sách thử thách.
     */
    async getAllChallenges(filters = {}) {
        try {
            const whereClause = {}; // Mệnh đề WHERE cho truy vấn

            // Áp dụng các bộ lọc nếu có
            if (filters.status) {
                whereClause.status = filters.status;
            }
            if (filters.community_member_id) {
                whereClause.community_member_id = filters.community_member_id;
            }
            if (filters.is_weekly !== undefined) { // Lọc theo is_weekly nếu được cung cấp
                whereClause.is_weekly = filters.is_weekly;
            }
            // Bạn có thể thêm các bộ lọc khác dựa trên các trường của model Challenge.js

            const challenges = await Challenge.findAll({
                where: whereClause,
                order: [['created_at', 'DESC']], // Sắp xếp theo ngày tạo mới nhất
                // Nếu bạn muốn lấy cả thông tin người tạo (CommunityMember), bạn có thể thêm 'include'
                // include: [{ model: CommunityMember, as: 'member' }]
            });

            return challenges.map(challenge => challenge.toJSON());
        } catch (error) {
            throw new Error(`Lỗi khi lấy danh sách thử thách: ${error.message}`);
        }
    }

    /**
     * Lấy một thử thách cụ thể bằng ID.
     * @param {number|string} id - ID của thử thách.
     * @returns {Promise<object>} - Đối tượng thử thách.
     * @throws {Error} - Ném lỗi nếu không tìm thấy thử thách hoặc có lỗi truy vấn.
     */
    async getChallengeById(id) {
        try {
            const challenge = await Challenge.findByPk(id, {
                // Nếu bạn muốn lấy cả thông tin người tạo (CommunityMember)
                // include: [{ model: CommunityMember, as: 'member' }]
            });

            if (!challenge) {
                throw new Error('Không tìm thấy thử thách với ID đã cho.');
            }
            return challenge.toJSON();
        } catch (error) {
            // Phân biệt lỗi không tìm thấy và lỗi hệ thống
            if (error.message === 'Không tìm thấy thử thách với ID đã cho.') {
                throw error;
            }
            throw new Error(`Lỗi khi lấy thử thách theo ID: ${error.message}`);
        }
    }

    /**
     * Cập nhật thông tin một thử thách.
     * @param {number|string} id - ID của thử thách cần cập nhật.
     * @param {object} updateData - Dữ liệu cần cập nhật.
     * @returns {Promise<object>} - Đối tượng thử thách sau khi đã cập nhật.
     * @throws {Error} - Ném lỗi nếu không tìm thấy thử thách hoặc có lỗi khi cập nhật.
     */
    async updateChallenge(id, updateData) {
        try {
            const challenge = await Challenge.findByPk(id);
            if (!challenge) {
                throw new Error('Không tìm thấy thử thách để cập nhật.');
            }

            // Cập nhật các trường được phép
            // Ví dụ: title, description, reward_type, reward_value, due_date, status, is_weekly, recurrence_rule
            // Cần cẩn thận không cho phép cập nhật các trường nhạy cảm hoặc không nên thay đổi trực tiếp
            const updatedChallenge = await challenge.update(updateData);
            return updatedChallenge.toJSON();
        } catch (error) {
            if (error.message === 'Không tìm thấy thử thách để cập nhật.') {
                throw error;
            }
            throw new Error(`Lỗi khi cập nhật thử thách: ${error.message}`);
        }
    }

    /**
     * Xóa một thử thách.
     * @param {number|string} id - ID của thử thách cần xóa.
     * @returns {Promise<{id: number|string, deleted: boolean}>} - Thông tin về việc xóa.
     * @throws {Error} - Ném lỗi nếu không tìm thấy thử thách hoặc có lỗi khi xóa.
     */
    async deleteChallenge(id) {
        try {
            const challenge = await Challenge.findByPk(id);
            if (!challenge) {
                throw new Error('Không tìm thấy thử thách để xóa.');
            }

            await challenge.destroy();
            return { id, deleted: true, message: 'Thử thách đã được xóa thành công.' };
        } catch (error) {
            if (error.message === 'Không tìm thấy thử thách để xóa.') {
                throw error;
            }
            throw new Error(`Lỗi khi xóa thử thách: ${error.message}`);
        }
    }

    /**
     * Tìm kiếm thử thách theo tiêu đề hoặc mô tả.
     * @param {string} searchTerm - Từ khóa tìm kiếm.
     * @returns {Promise<Array<object>>} - Mảng các thử thách phù hợp.
     * @throws {Error} - Ném lỗi nếu có vấn đề khi tìm kiếm.
     */
    async searchChallenges(searchTerm) {
        try {
            if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
                return []; // Trả về mảng rỗng nếu searchTerm không hợp lệ
            }
            const challenges = await Challenge.findAll({
                where: {
                    [Op.or]: [
                        { title: { [Op.like]: `%${searchTerm}%` } },
                        { description: { [Op.like]: `%${searchTerm}%` } }
                        // Bạn có thể thêm các trường khác để tìm kiếm nếu cần
                    ]
                },
                order: [['created_at', 'DESC']],
            });
            return challenges.map(challenge => challenge.toJSON());
        } catch (error) {
            throw new Error(`Lỗi khi tìm kiếm thử thách: ${error.message}`);
        }
    }

    // Các phương thức tùy chỉnh khác có thể được thêm vào đây
    // Ví dụ: getChallengesByStatus, getChallengesByCommunityMember, etc.

    /**
     * Lấy thử thách theo trạng thái.
     * @param {string} status - Trạng thái của thử thách (ví dụ: 'pending', 'done').
     * @returns {Promise<Array<object>>} - Mảng các thử thách có trạng thái tương ứng.
     * @throws {Error} - Ném lỗi nếu có vấn đề khi truy vấn.
     */
    async getChallengesByStatus(status) {
        try {
            if (!status) {
                throw new Error('Trạng thái không được để trống.');
            }
            const challenges = await Challenge.findAll({
                where: { status },
                order: [['created_at', 'DESC']],
            });
            return challenges.map(challenge => challenge.toJSON());
        } catch (error) {
            throw new Error(`Lỗi khi lấy thử thách theo trạng thái: ${error.message}`);
        }
    }
}

module.exports = new ChallengeRepository();
